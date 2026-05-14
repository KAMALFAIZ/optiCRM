export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  lastLoginAt?: string;
  preferredLanguage?: string;
  timezone?: string;
  createdAt?: string;
  role?: {
    id: string;
    name: string;
    description?: string;
  };
  team?: {
    id: string;
    name: string;
  };
  territory?: {
    id: string;
    name: string;
    region?: string;
  };
}

export interface CreateUserRequest {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: string;
  teamId?: string;
  territoryId?: string;
  preferredLanguage?: string;
  timezone?: string;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  roleId?: string;
  teamId?: string;
  territoryId?: string;
  preferredLanguage?: string;
  timezone?: string;
  isActive?: boolean;
}

export interface ChangePasswordRequest {
  newPassword: string;
}

export interface RoleOption {
  id: string;
  name: string;
  description?: string;
}

export interface TeamOption {
  id: string;
  name: string;
}

export interface TerritoryOption {
  id: string;
  name: string;
  region?: string;
}

// Statistics
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  lockedUsers: number;
  recentLogins: number;
  usersByRole: Record<string, number>;
}

// Activity
export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  details?: string;
  performedBy?: string;
  createdAt: string;
}

export const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'red',
  ADMIN: 'volcano',
  MANAGER: 'blue',
  SUPERVISEUR: 'cyan',
  COMMERCIAL: 'green',
  READ_ONLY: 'default',
};

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrateur',
  MANAGER: 'Manager',
  SUPERVISEUR: 'Superviseur',
  COMMERCIAL: 'Commercial',
  READ_ONLY: 'Lecture seule',
};

export const ACTIVITY_LABELS: Record<string, { label: string; color: string }> = {
  USER_CREATED: { label: 'Cr\u00e9ation', color: 'green' },
  USER_UPDATED: { label: 'Modification', color: 'blue' },
  USER_ACTIVATED: { label: 'Activation', color: 'cyan' },
  USER_DEACTIVATED: { label: 'D\u00e9sactivation', color: 'orange' },
  PASSWORD_CHANGED: { label: 'Mot de passe', color: 'purple' },
  USER_UNLOCKED: { label: 'D\u00e9verrouillage', color: 'gold' },
  AVATAR_UPDATED: { label: 'Avatar', color: 'magenta' },
};

export const LANGUAGES = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' },
];

export const TIMEZONES = [
  { value: 'Africa/Casablanca', label: 'Casablanca (GMT+1)' },
  { value: 'Europe/Paris', label: 'Paris (GMT+1/+2)' },
  { value: 'Europe/London', label: 'Londres (GMT/+1)' },
  { value: 'America/New_York', label: 'New York (GMT-5/-4)' },
];
