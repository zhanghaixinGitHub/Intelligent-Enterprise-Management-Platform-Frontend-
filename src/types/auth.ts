export interface UserMenu {
  key: string;
  title: string;
  desc: string;
  path: string;
  icon: string;
  order: number;
  children?: UserMenu[];
}

export interface AuthUser {
  employeeId: string;
  username: string;
  displayName: string;
  departmentId: string;
  roleCodes: string[];
  roleNames: string[];
  status: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: string;
  user: AuthUser;
  menus: UserMenu[];
  homePath: string;
  actionScopes: string[];
}

export interface CurrentUserResponse {
  user: AuthUser;
  menus: UserMenu[];
  homePath: string;
  actionScopes: string[];
}

