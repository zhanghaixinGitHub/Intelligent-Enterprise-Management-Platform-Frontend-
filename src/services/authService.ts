import { http } from "./http";
import type { ExtendedRequestConfig } from "./http";
import type { AxiosRequestConfig } from "axios";
import type { CurrentUserResponse, LoginPayload, LoginResponse, UserMenu } from "../types/auth";

const preserveAuthSnapshotConfig: AxiosRequestConfig & ExtendedRequestConfig = {
  skipAuthStorageClear: true
};

export const login = async (payload: LoginPayload) => {
  const { data } = await http.post<LoginResponse>("/api/v1/auth/login", payload);
  return data;
};

export const getCurrentUserInfo = async () => {
  const { data } = await http.get<CurrentUserResponse>("/api/v1/auth/me", preserveAuthSnapshotConfig);
  return data;
};

export const getUserMenus = async () => {
  const { data } = await http.get<{ menus: UserMenu[]; homePath: string }>("/api/v1/auth/menus", preserveAuthSnapshotConfig);
  return data;
};

export const logout = async () => {
  const { data } = await http.post<{ success: boolean }>("/api/v1/auth/logout");
  return data;
};

