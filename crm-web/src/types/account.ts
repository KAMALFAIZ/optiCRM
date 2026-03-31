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
  codeClientCrm?: string; // Code client interne OptiCRM
  societeAffectation?: string; // Société d'affectation (Sanitaire AL Boughaze, Odyssée…)
  siret?: string;
  siren?: string;
  vatNumber?: string;
  // Identification - Maroc
  ice?: string; // Identifiant Commun Entreprise (15 chiffres)
  identifiantFiscal?: string; // IF - Identifiant Fiscal
  rc?: string; // Registre de Commerce
  cnss?: string; // Numéro CNSS
  patente?: string; // Numéro de Patente
  capitalSocial?: number; // Capital social
  associes?: string; // Associés / actionnaires (texte libre)
  accountType: string;
  industry?: {
    id: string;
    code: string;
    name: string;
  };
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
  // Classification Sage 100C
  secteurActivite?: string;
  categorieClient?: string;
  categorieTarifaire?: string;
  typeCompteOdyssee?: string;
  prefecture?: string;
  statutCompte?: string;
  representant?: string;
  // ODYSSÉE Distribution
  famille?: string;
  rolePrincipal?: string;
  potentiel?: string;
  actionSuivante?: string;
  dateProchaineAction?: string;
  creditLimit?: number;
  insuranceAmount?: number;
  insuranceCompany?: string;
  paymentTermsId?: string;
  parentAccount?: {
    id: string;
    name: string;
  };
  assignedTo?: {
    id: string;
    fullName: string;
    email: string;
  };
  territory?: {
    id: string;
    name: string;
    region?: string;
  };
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
  // ODYSSÉE Distribution
  famille?: string;
  typeCompteOdyssee?: string;
  prefecture?: string;
  statutCompte?: string;
  potentiel?: string;
  // GPS - carte interactive
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

export interface CreateAccountRequest {
  name: string;
  legalName?: string;
  codeClientCrm?: string;
  societeAffectation?: string;
  siret?: string;
  siren?: string;
  vatNumber?: string;
  // Identification - Maroc
  ice?: string; // Identifiant Commun Entreprise (15 chiffres)
  identifiantFiscal?: string; // IF - Identifiant Fiscal
  rc?: string; // Registre de Commerce
  cnss?: string; // Numéro CNSS
  patente?: string; // Numéro de Patente
  capitalSocial?: number; // Capital social
  associes?: string; // Associés / actionnaires
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
  shippingStreet?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  website?: string;
  phone?: string;
  whatsapp?: string;
  segment?: string;
  tags?: string[];
  creditLimit?: number;
  insuranceAmount?: number;
  insuranceCompany?: string;
  paymentTermsId?: string;
  parentAccountId?: string;
  assignedToId?: string;
  territoryId?: string;
  pricingCategoryId?: string;
}

export interface UpdateAccountRequest extends Partial<CreateAccountRequest> {
  accountScore?: number;
}

export interface Industry {
  id: string;
  code: string;
  name: string;
  parentId?: string;
}

export const SOCIETES_AFFECTATION = [
  { value: 'Sanitaire AL Boughaze', label: 'Sanitaire AL Boughaze' },
  { value: 'Odyssée', label: 'Odyssée' },
];

export const ACCOUNT_TYPES = [
  { value: 'Prospect', label: 'Prospect', color: 'blue' },
  { value: 'Client', label: 'Client', color: 'green' },
  { value: 'Partenaire', label: 'Partenaire', color: 'purple' },
  { value: 'Fournisseur', label: 'Fournisseur', color: 'orange' },
];

export const EMPLOYEE_RANGES = [
  { value: '1-10', label: '1-10 employés' },
  { value: '11-50', label: '11-50 employés' },
  { value: '51-200', label: '51-200 employés' },
  { value: '201-500', label: '201-500 employés' },
  { value: '501-1000', label: '501-1000 employés' },
  { value: '1000+', label: 'Plus de 1000 employés' },
];
