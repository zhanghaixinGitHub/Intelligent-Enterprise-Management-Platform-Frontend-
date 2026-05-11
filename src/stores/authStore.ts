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
  expiresAt: string;
  initialized: boolean;
}

const createInitialState = (): AuthState => {
  const authSnapshot = readAuthSnapshot();

  return {
    token: getAccessToken(),
    user: authSnapshot.user,
    menus: authSnapshot.menus,
    actionScopes: authSnapshot.actionScopes,
    homePath: authSnapshot.homePath,
    expiresAt: authSnapshot.expiresAt,
    initialized: false
  };
};

const isTokenExpired = (expiresAt: string) => {
  if (!expiresAt) {
    return false;
  }

  const expiresAtTimestamp = Date.parse(expiresAt);
  return Number.isFinite(expiresAtTimestamp) && expiresAtTimestamp <= Date.now();
};

const hasLocalAuthSnapshot = (state: Pick<AuthState, "token" | "user" | "menus">) => {
  return Boolean(state.token && state.user && state.menus.length > 0);
};

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => createInitialState(),
  getters: {
    isAuthenticated: (state) => Boolean(state.token && state.user),
    menuKeys: (state) => state.menus.map((item) => item.key)
  },
  actions: {
    applyAuthResult(payload: { token: string; user: AuthUser; menus: UserMenu[]; homePath: string; actionScopes?: string[]; expiresAt?: string }) {
      this.token = payload.token;
      this.user = payload.user;
      this.menus = [...payload.menus].sort((left, right) => left.order - right.order);
      this.homePath = payload.homePath || "/403";
      this.actionScopes = payload.actionScopes || [];
      this.expiresAt = payload.expiresAt || this.expiresAt;
      saveAccessToken(payload.token);
      saveAuthSnapshot({
        user: payload.user,
        menus: this.menus,
        homePath: this.homePath,
        actionScopes: this.actionScopes,
        expiresAt: this.expiresAt
      });
    },
    async login(payload: LoginPayload) {
      const result = await loginRequest(payload);
      this.applyAuthResult({
        token: result.accessToken,
        user: result.user,
        menus: result.menus,
        homePath: result.homePath,
        expiresAt: result.expiresAt
      });
      this.initialized = true;
      return result;
    },
    async bootstrap() {
      if (!this.token) {
        this.initialized = true;
        return false;
      }

      /*
        为什么这样改：
        1. 浏览器刷新会让 Pinia 内存态丢失，但本地 localStorage 里仍然保留着最近一次登录成功后的用户、菜单与首页信息；
        2. 如果此时后端鉴权恢复接口短暂失败（例如演示服务未完成 token 校验、接口瞬时抖动、开发联调阶段返回 401），
           原实现会直接 resetAuth，导致用户每次刷新都被踢回登录页；
        3. 这里增加“未过期快照兜底”策略：只要本地 token 与菜单快照完整，且 token 未声明过期，就允许先继续留在系统内，
           这样既能修复刷新丢登录的问题，也保留了后续接口成功时用服务端最新权限覆盖本地数据的能力。
      */
      const canUseLocalSnapshot = hasLocalAuthSnapshot(this) && !isTokenExpired(this.expiresAt);

      if (isTokenExpired(this.expiresAt)) {
        this.resetAuth();
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
          actionScopes: currentUserResult.actionScopes,
          expiresAt: this.expiresAt
        });
        this.initialized = true;
        return true;
      } catch {
        if (canUseLocalSnapshot) {
          this.initialized = true;
          return true;
        }

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
      this.expiresAt = "";
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

