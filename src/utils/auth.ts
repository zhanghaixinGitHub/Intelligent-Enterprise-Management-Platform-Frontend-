import type { AuthUser, UserMenu } from "../types/auth";

const ACCESS_TOKEN_KEY = "ai-enterprise-access-token";
const AUTH_USER_KEY = "ai-enterprise-auth-user";
const AUTH_MENUS_KEY = "ai-enterprise-auth-menus";
const AUTH_HOME_PATH_KEY = "ai-enterprise-home-path";

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY) || "";

export const saveAccessToken = (token: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const saveAuthSnapshot = (payload: { user: AuthUser; menus: UserMenu[]; homePath: string }) => {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(payload.user));
  localStorage.setItem(AUTH_MENUS_KEY, JSON.stringify(payload.menus));
  localStorage.setItem(AUTH_HOME_PATH_KEY, payload.homePath);
};

export const readAuthSnapshot = () => {
  const userRaw = localStorage.getItem(AUTH_USER_KEY);
  const menusRaw = localStorage.getItem(AUTH_MENUS_KEY);
  const homePath = localStorage.getItem(AUTH_HOME_PATH_KEY) || "/403";

  return {
    user: userRaw ? (JSON.parse(userRaw) as AuthUser) : null,
    menus: menusRaw ? (JSON.parse(menusRaw) as UserMenu[]) : [],
    homePath
  };
};

export const clearAuthStorage = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_MENUS_KEY);
  localStorage.removeItem(AUTH_HOME_PATH_KEY);
};

