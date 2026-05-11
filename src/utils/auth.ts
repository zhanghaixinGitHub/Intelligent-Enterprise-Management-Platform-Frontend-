import type { AuthUser, UserMenu } from "../types/auth";

const ACCESS_TOKEN_KEY = "ai-enterprise-access-token";
const AUTH_USER_KEY = "ai-enterprise-auth-user";
const AUTH_MENUS_KEY = "ai-enterprise-auth-menus";
const AUTH_HOME_PATH_KEY = "ai-enterprise-home-path";
const AUTH_ACTION_SCOPES_KEY = "ai-enterprise-action-scopes";
const AUTH_EXPIRES_AT_KEY = "ai-enterprise-expires-at";

export interface AuthSnapshot {
  user: AuthUser | null;
  menus: UserMenu[];
  homePath: string;
  actionScopes: string[];
  expiresAt: string;
}

const safeParseJson = <T>(rawValue: string | null, fallbackValue: T): T => {
  if (!rawValue) {
    return fallbackValue;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    /*
      为什么这样改：
      1. 浏览器本地存储可能被手动修改、历史版本残留或异常写入破坏；
      2. 刷新时如果直接 JSON.parse 抛错，会导致整个鉴权恢复链路中断；
      3. 这里统一降级为安全默认值，保证页面至少可以进入受控的重新登录或快照兜底流程。
    */
    return fallbackValue;
  }
};

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY) || "";

export const saveAccessToken = (token: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const saveAuthSnapshot = (payload: { user: AuthUser; menus: UserMenu[]; homePath: string; actionScopes?: string[]; expiresAt?: string }) => {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(payload.user));
  localStorage.setItem(AUTH_MENUS_KEY, JSON.stringify(payload.menus));
  localStorage.setItem(AUTH_HOME_PATH_KEY, payload.homePath);
  localStorage.setItem(AUTH_ACTION_SCOPES_KEY, JSON.stringify(payload.actionScopes || []));
  localStorage.setItem(AUTH_EXPIRES_AT_KEY, payload.expiresAt || "");
};

export const readAuthSnapshot = (): AuthSnapshot => ({
  user: safeParseJson<AuthUser | null>(localStorage.getItem(AUTH_USER_KEY), null),
  menus: safeParseJson<UserMenu[]>(localStorage.getItem(AUTH_MENUS_KEY), []),
  homePath: localStorage.getItem(AUTH_HOME_PATH_KEY) || "/403",
  actionScopes: safeParseJson<string[]>(localStorage.getItem(AUTH_ACTION_SCOPES_KEY), []),
  expiresAt: localStorage.getItem(AUTH_EXPIRES_AT_KEY) || ""
});

export const clearAuthStorage = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_MENUS_KEY);
  localStorage.removeItem(AUTH_HOME_PATH_KEY);
  localStorage.removeItem(AUTH_ACTION_SCOPES_KEY);
  localStorage.removeItem(AUTH_EXPIRES_AT_KEY);
};

