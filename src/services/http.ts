import axios from "axios";
import type { AxiosRequestConfig } from "axios";
import { clearAuthStorage, getAccessToken } from "../utils/auth";

export interface ExtendedRequestConfig extends AxiosRequestConfig {
  skipAuthStorageClear?: boolean;
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8002",
  timeout: 10000
});

http.interceptors.request.use((config) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    /*
      为什么这样改：
      1. 默认场景下，401 仍然说明本地登录态大概率失效，清空缓存是合理的安全兜底；
      2. 但“页面刷新后的身份恢复请求”属于特殊场景，如果这里立刻清空 localStorage，
         即使 store 允许使用本地快照兜底，下一次刷新也会因为缓存已被清掉而再次回到登录页；
      3. 因此为请求增加显式开关，只有明确声明需要保留快照时，才跳过这一步全局清理。
    */
    const requestConfig = error?.config as ExtendedRequestConfig | undefined;

    if (error?.response?.status === 401 && !requestConfig?.skipAuthStorageClear) {
      clearAuthStorage();
    }
    return Promise.reject(error);
  }
);

