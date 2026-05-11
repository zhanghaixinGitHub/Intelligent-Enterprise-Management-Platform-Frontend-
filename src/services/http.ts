import axios from "axios";
import type { AxiosRequestConfig } from "axios";
import { clearAuthStorage, getAccessToken } from "../utils/auth";

export interface ExtendedRequestConfig extends AxiosRequestConfig {
  skipAuthStorageClear?: boolean;
}

const resolveApiBaseUrl = () => {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  /*
    为什么这样改：
    1. 项目当前存在 .env.development，把 VITE_API_BASE_URL 配成了 http://127.0.0.1:8002，
       这会覆盖掉默认值，导致浏览器继续直接跨域访问后端；
    2. 在 Vite 开发环境中，前端更推荐通过同源代理转发到后端，既能规避 CORS，
       也能保持前后端联调地址的一致性；
    3. 因此这里增加一个“配置归一化”步骤：如果发现是本机开发常见的绝对地址，
       或者误把 baseURL 配成 /api，而具体 service 又已经以 /api/v1 开头，
       就自动回退为空字符串，让 axios 直接使用 service 内的完整相对路径；
    4. 生产环境或真实网关地址仍然保留外部配置优先，不影响正式部署。
  */
  if (!configuredBaseUrl) {
    return "";
  }

  const isLocalAbsoluteApi = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(configuredBaseUrl);
  const isDuplicatedApiPrefix = configuredBaseUrl === "/api";

  if (import.meta.env.DEV && (isLocalAbsoluteApi || isDuplicatedApiPrefix)) {
    return "";
  }

  return configuredBaseUrl;
};

export const http = axios.create({
  /*
    为什么这样改：
    1. 当前前端开发服务运行在 http://localhost:5173，而后端接口实际访问的是 http://127.0.0.1:8002；
    2. localhost 与 127.0.0.1 在浏览器看来属于不同源，直接请求会触发 CORS 校验，导致“立即打卡”请求在浏览器层就被拦截，后端路由自然不会进入；
    3. 这里把默认 baseURL 改成同源相对路径，配合 Vite 代理把 /api 请求转发到后端，既能修复本地联调问题，也避免把具体主机地址硬编码在前端代码里；
    4. 如果后续部署环境已经通过网关/反向代理统一转发，继续使用相对路径也更符合企业项目的网关接入方式。
  */
  baseURL: resolveApiBaseUrl(),
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

