import { defineStore } from "pinia";
import type { AuthUser, LoginPayload, UserMenu } from "../types/auth";
import { getCurrentUserInfo, getUserMenus, login as loginRequest, logout as logoutRequest } from "../services/authService";
import { clearAuthStorage, getAccessToken, readAuthSnapshot, saveAccessToken, saveAuthSnapshot } from "../utils/auth";

interface AuthState {
  token: string;
  user: AuthUser | null;
  menus: UserMenu[];
  actionScopes: string[];
  homePath: string;
  initialized: boolean;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    token: getAccessToken(),
    user: readAuthSnapshot().user,
    menus: readAuthSnapshot().menus,
    actionScopes: [],
    homePath: readAuthSnapshot().homePath,
    initialized: false
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token && state.user),
    menuKeys: (state) => state.menus.map((item) => item.key)
  },
  actions: {
    applyAuthResult(payload: { token: string; user: AuthUser; menus: UserMenu[]; homePath: string; actionScopes?: string[] }) {
      this.token = payload.token;
      this.user = payload.user;
      this.menus = [...payload.menus].sort((left, right) => left.order - right.order);
      this.homePath = payload.homePath || "/403";
      this.actionScopes = payload.actionScopes || [];
      saveAccessToken(payload.token);
      saveAuthSnapshot({ user: payload.user, menus: payload.menus, homePath: this.homePath });
    },
    async login(payload: LoginPayload) {
      const result = await loginRequest(payload);
      this.applyAuthResult({
        token: result.accessToken,
        user: result.user,
        menus: result.menus,
        homePath: result.homePath
      });
      this.initialized = true;
      return result;
    },
    async bootstrap() {
      if (!this.token) {
        this.initialized = true;
        return false;
      }

      try {
        const [currentUserResult, menuResult] = await Promise.all([getCurrentUserInfo(), getUserMenus()]);
        this.applyAuthResult({
          token: this.token,
          user: currentUserResult.user,
          menus: menuResult.menus,
          homePath: menuResult.homePath,
          actionScopes: currentUserResult.actionScopes
        });
        this.initialized = true;
        return true;
      } catch {
        this.resetAuth();
        this.initialized = true;
        return false;
      }
    },
    hasMenuPermission(menuKey: string) {
      return this.menus.some((item) => item.key === menuKey);
    },
    resetAuth() {
      this.token = "";
      this.user = null;
      this.menus = [];
      this.actionScopes = [];
      this.homePath = "/403";
      clearAuthStorage();
    },
    async logout() {
      try {
        if (this.token) {
          await logoutRequest();
        }
      } finally {
        this.resetAuth();
        this.initialized = true;
      }
    }
  }
});

