export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  lastLoginAt?: string;
  preferredLanguage: string;
  timezone: string;
  createdAt: string;
  role?: RoleInfo;
  team?: TeamInfo;
  territory?: TerritoryInfo;
}

export interface RoleInfo {
  id: string;
  name: string;
  description?: string;
  permissions?: Record<string, Record<string, boolean>>;
}

export interface TeamInfo {
  id: string;
  name: string;
}

export interface TerritoryInfo {
  id: string;
  name: string;
  region?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    role?: string;
    teamId?: string;
    territoryId?: string;
  };
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}
