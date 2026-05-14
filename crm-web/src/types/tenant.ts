export interface SubscriptionPlan {
  id: string; // FREE | STARTER | PRO | ENTERPRISE
  name: string;
  description?: string;
  priceMonthly: number;
  priceYearly: number;
  maxUsers: number;   // -1 = unlimited
  maxAccounts: number;
  features: Record<string, boolean>;
  isActive: boolean;
  sortOrder: number;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
  plan?: SubscriptionPlan;
  logoUrl?: string;
  primaryColor?: string;
  customDomain?: string;
  trialEndsAt?: string;
  maxUsers?: number;
  adminEmail?: string;
  createdAt: string;
}

export interface TenantPublicInfo {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
  primaryColor: string;
  status: string;
}

export interface TenantState {
  tenant: Tenant | null;
  publicInfo: TenantPublicInfo | null;
  plans: SubscriptionPlan[];
  isLoading: boolean;
  error: string | null;
}
