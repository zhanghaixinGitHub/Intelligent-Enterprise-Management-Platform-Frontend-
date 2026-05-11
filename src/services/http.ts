import axios from "axios";
import { clearAuthStorage, getAccessToken } from "../utils/auth";

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
    // 统一拦截 401：通常表示本地 token 失效，先清空缓存，后续由路由守卫把用户带回登录页。
    if (error?.response?.status === 401) {
      clearAuthStorage();
    }
    return Promise.reject(error);
  }
);

