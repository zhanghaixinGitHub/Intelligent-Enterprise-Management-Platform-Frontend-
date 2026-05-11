import { http } from "./http";
import type { CurrentUserResponse, LoginPayload, LoginResponse, UserMenu } from "../types/auth";

export const login = async (payload: LoginPayload) => {
  const { data } = await http.post<LoginResponse>("/api/v1/auth/login", payload);
  return data;
};

export const getCurrentUserInfo = async () => {
  const { data } = await http.get<CurrentUserResponse>("/api/v1/auth/me");
  return data;
};

export const getUserMenus = async () => {
  const { data } = await http.get<{ menus: UserMenu[]; homePath: string }>("/api/v1/auth/menus");
  return data;
};

export const logout = async () => {
  const { data } = await http.post<{ success: boolean }>("/api/v1/auth/logout");
  return data;
};

