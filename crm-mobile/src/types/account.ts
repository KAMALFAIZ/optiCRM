export interface AccountPhoto {
  id: string;
  url: string;
  caption?: string;
  displayOrder: number;
  uploadedAt: string;
}

export interface PricingCategorySummary {
  id: string;
  code: string;
  name: string;
  isDefault: boolean;
}

export interface Account {
  id: string;
  name: string;
  logoUrl?: string;
  legalName?: string;
  codeClientCrm?: string;
  societeAffectation?: string;
  siret?: string;
  siren?: string;
  vatNumber?: string;
  ice?: string;
  identifiantFiscal?: string;
  rc?: string;
  cnss?: string;
  patente?: string;
  capitalSocial?: number;
  associes?: string;
  accountType: string;
  industry?: { id: string; code: string; name: string };
  employeeCount?: number;
  annualRevenue?: number;
  revenueCurrency?: string;
  billingStreet?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  fullBillingAddress?: string;
  latitude?: number;
  longitude?: number;
  shippingStreet?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  website?: string;
  phone?: string;
  whatsapp?: string;
  accountScore?: number;
  segment?: string;
  tags?: string[];
  secteurActivite?: string;
  categorieClient?: string;
  categorieTarifaire?: string;
  typeCompteOdyssee?: string;
  prefecture?: string;
  statutCompte?: string;
  representant?: string;
  famille?: string;
  rolePrincipal?: string;
  potentiel?: string;
  actionSuivante?: string;
  dateProchaineAction?: string;
  creditLimit?: number;
  insuranceAmount?: number;
  insuranceCompany?: string;
  paymentTermsId?: string;
  parentAccount?: { id: string; name: string };
  assignedTo?: { id: string; fullName: string; email: string };
  territory?: { id: string; name: string; region?: string };
  contactCount?: number;
  photos?: AccountPhoto[];
  pricingCategory?: PricingCategorySummary;
  createdAt: string;
  updatedAt?: string;
}

export interface AccountListItem {
  id: string;
  name: string;
  logoUrl?: string;
  accountType: string;
  segment?: string;
  industryName?: string;
  billingCity?: string;
  billingCountry?: string;
  phone?: string;
  ice?: string;
  sageCode?: string;
  codeClientCrm?: string;
  societeAffectation?: string;
  website?: string;
  annualRevenue?: number;
  employeeCount?: number;
  tags?: string[];
  assignedToName?: string;
  contactCount?: number;
  accountScore?: number;
  famille?: string;
  typeCompteOdyssee?: string;
  prefecture?: string;
  statutCompte?: string;
  potentiel?: string;
  latitude?: number;
  longitude?: number;
}

export interface HealthScoreBreakdown {
  engagement: number;
  conversion: number;
  revenue: number;
  profile: number;
  openOpportunities: number;
  wonOpportunities: number;
  totalOpportunities: number;
  winRate: number;
  wonRevenue: number;
  openPipeline: number;
  hasPhone: boolean;
  hasWebsite: boolean;
  hasBillingCity: boolean;
  hasIndustry: boolean;
  hasSegment: boolean;
}

export interface HealthScoreDto {
  score: number;
  label: string;
  color: string;
  breakdown: HealthScoreBreakdown;
}

export interface AccountStats {
  totalContacts: number;
  totalOpportunities: number;
  openOpportunities: number;
  wonOpportunities: number;
  wonAmount: number;
  openPipeline: number;
  totalRevenue: number;
  totalPaid: number;
  totalDue: number;
  caCurrentYear: number;
  caPreviousYear: number;
  overdueInvoices: number;
  overdueAmount: number;
}

export interface CreateAccountRequest {
  name: string;
  legalName?: string;
  codeClientCrm?: string;
  societeAffectation?: string;
  ice?: string;
  identifiantFiscal?: string;
  rc?: string;
  cnss?: string;
  patente?: string;
  capitalSocial?: number;
  associes?: string;
  accountType: string;
  industryId?: string;
  employeeCount?: number;
  annualRevenue?: number;
  revenueCurrency?: string;
  billingStreet?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  latitude?: number;
  longitude?: number;
  website?: string;
  phone?: string;
  whatsapp?: string;
  segment?: string;
  tags?: string[];
  creditLimit?: number;
  parentAccountId?: string;
  assignedToId?: string;
  territoryId?: string;
  pricingCategoryId?: string;
}

export type UpdateAccountRequest = Partial<CreateAccountRequest> & {
  accountScore?: number;
};

export interface Industry {
  id: string;
  code: string;
  name: string;
  parentId?: string;
}

export const ACCOUNT_TYPES = [
  { value: 'Prospect', label: 'Prospect', color: '#1976D2' },
  { value: 'Client', label: 'Client', color: '#4CAF50' },
  { value: 'Partenaire', label: 'Partenaire', color: '#9C27B0' },
  { value: 'Fournisseur', label: 'Fournisseur', color: '#FF9800' },
];
