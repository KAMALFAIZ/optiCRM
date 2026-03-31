export interface Lead {
  id: string;
  salutation?: string;
  firstName?: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  companyName?: string;
  jobTitle?: string;
  website?: string;

  // Address
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  fullAddress?: string;

  // Lead Info
  status: string;
  source?: string;
  sourceDetails?: string;
  rating?: string;
  leadScore?: number;
  interestedProducts?: string[];
  budgetRange?: string;
  decisionTimeframe?: string;

  // Champs avancés
  fax?: string;
  linkedinUrl?: string;
  industry?: string;
  numEmployees?: string;
  annualRevenue?: string;
  priority?: string;
  doNotCall?: boolean;
  doNotEmail?: boolean;
  nextFollowUpDate?: string;
  description?: string;

  // Qualification avancée (V26)
  qualificationNotes?: string;
  competitor?: string;
  productDemoRequested?: boolean;
  meetingScheduledAt?: string;

  // Relations
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
  campaignId?: string;

  // Conversion
  isConverted?: boolean;
  convertedAt?: string;
  convertedContactId?: string;
  convertedAccountId?: string;
  convertedOpportunityId?: string;

  // Audit
  createdAt: string;
  updatedAt?: string;
  lastActivityAt?: string;
}

export interface LeadListItem {
  id: string;
  firstName?: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  companyName?: string;
  jobTitle?: string;
  city?: string;
  country?: string;
  status: string;
  source?: string;
  rating?: string;
  leadScore?: number;
  assignedToId?: string;
  assignedToName?: string;
  createdAt: string;
  lastActivityAt?: string;
}

export interface CreateLeadRequest {
  salutation?: string;
  firstName?: string;
  lastName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  companyName?: string;
  jobTitle?: string;
  website?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  status?: string;
  source?: string;
  sourceDetails?: string;
  rating?: string;
  leadScore?: number;
  interestedProducts?: string[];
  budgetRange?: string;
  decisionTimeframe?: string;
  fax?: string;
  linkedinUrl?: string;
  industry?: string;
  numEmployees?: string;
  annualRevenue?: string;
  priority?: string;
  doNotCall?: boolean;
  doNotEmail?: boolean;
  nextFollowUpDate?: string;
  description?: string;
  qualificationNotes?: string;
  competitor?: string;
  productDemoRequested?: boolean;
  meetingScheduledAt?: string;
  assignedToId?: string;
  territoryId?: string;
  campaignId?: string;
}

export interface UpdateLeadRequest extends Partial<CreateLeadRequest> {}

export interface LeadScoreBreakdown {
  profile: number;
  qualification: number;
  engagement: number;
  hasEmail: boolean;
  hasPhone: boolean;
  hasCompany: boolean;
  hasJobTitle: boolean;
  hasCity: boolean;
  hasWebOrLinkedin: boolean;
  hasBudgetRange: boolean;
  hasDecisionTimeframe: boolean;
  hasInterestedProducts: boolean;
  hasIndustry: boolean;
  hasNumEmployees: boolean;
  status: string;
  rating: string;
  hasMeetingScheduled: boolean;
  hasDemoRequested: boolean;
}

export interface LeadScoreDto {
  score: number;
  label: string;
  color: string;
  breakdown: LeadScoreBreakdown;
}

export interface ConvertLeadRequest {
  createAccount?: boolean;
  createContact?: boolean;
  createOpportunity?: boolean;
  accountName?: string;
  accountType?: string;
  industryId?: string;
  opportunityName?: string;
  opportunityAmount?: number;
  opportunityStageId?: string;
  closeDate?: string;
  existingAccountId?: string;
}

export const SALUTATIONS = [
  { value: 'M.', label: 'M.' },
  { value: 'Mme', label: 'Mme' },
  { value: 'Dr.', label: 'Dr.' },
  { value: 'Pr.', label: 'Pr.' },
  { value: 'Me', label: 'Me' },
];

export const LEAD_STATUSES = [
  { value: 'new', label: 'Nouveau', color: 'blue' },
  { value: 'contacted', label: 'Contacté', color: 'cyan' },
  { value: 'qualified', label: 'Qualifié', color: 'green' },
  { value: 'unqualified', label: 'Non qualifié', color: 'red' },
  { value: 'nurturing', label: 'En nurturing', color: 'purple' },
  { value: 'converted', label: 'Converti', color: 'gold' },
];

export const LEAD_SOURCES = [
  { value: 'website', label: 'Site web' },
  { value: 'referral', label: 'Recommandation' },
  { value: 'cold_call', label: 'Appel à froid' },
  { value: 'trade_show', label: 'Salon' },
  { value: 'social_media', label: 'Réseaux sociaux' },
  { value: 'advertising', label: 'Publicité' },
  { value: 'email_campaign', label: 'Campagne email' },
  { value: 'partner', label: 'Partenaire' },
  { value: 'other', label: 'Autre' },
];

export const LEAD_RATINGS = [
  { value: 'hot', label: 'Chaud', color: 'red' },
  { value: 'warm', label: 'Tiède', color: 'orange' },
  { value: 'cold', label: 'Froid', color: 'blue' },
];

export const BUDGET_RANGES = [
  { value: 'under_10k', label: '< 10 000 €' },
  { value: '10k_50k', label: '10 000 € - 50 000 €' },
  { value: '50k_100k', label: '50 000 € - 100 000 €' },
  { value: '100k_500k', label: '100 000 € - 500 000 €' },
  { value: 'over_500k', label: '> 500 000 €' },
];

export const DECISION_TIMEFRAMES = [
  { value: 'immediate', label: 'Immédiat' },
  { value: '1_month', label: 'Dans le mois' },
  { value: '1_3_months', label: '1 à 3 mois' },
  { value: '3_6_months', label: '3 à 6 mois' },
  { value: '6_12_months', label: '6 à 12 mois' },
  { value: 'over_1_year', label: 'Plus d\'un an' },
];

export const LEAD_PRIORITIES = [
  { value: 'high', label: 'Haute', color: 'red' },
  { value: 'medium', label: 'Moyenne', color: 'orange' },
  { value: 'low', label: 'Basse', color: 'blue' },
];

export const INDUSTRIES = [
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'btp', label: 'BTP / Construction' },
  { value: 'commerce', label: 'Commerce & Distribution' },
  { value: 'education', label: 'Éducation & Formation' },
  { value: 'energie', label: 'Énergie & Environnement' },
  { value: 'finance', label: 'Finance & Banque' },
  { value: 'immobilier', label: 'Immobilier' },
  { value: 'industrie', label: 'Industrie & Manufacture' },
  { value: 'informatique', label: 'Informatique & Tech' },
  { value: 'sante', label: 'Santé & Pharmacie' },
  { value: 'services', label: 'Services aux entreprises' },
  { value: 'telecom', label: 'Télécommunications' },
  { value: 'tourisme', label: 'Tourisme & Hôtellerie' },
  { value: 'transport', label: 'Transport & Logistique' },
  { value: 'autre', label: 'Autre' },
];

export const NUM_EMPLOYEES_RANGES = [
  { value: '1_10', label: '1 – 10' },
  { value: '11_50', label: '11 – 50' },
  { value: '51_200', label: '51 – 200' },
  { value: '201_500', label: '201 – 500' },
  { value: '501_1000', label: '501 – 1 000' },
  { value: 'over_1000', label: '+ 1 000' },
];

export const ANNUAL_REVENUES = [
  { value: 'under_1m', label: '< 1 M MAD' },
  { value: '1m_5m', label: '1 – 5 M MAD' },
  { value: '5m_20m', label: '5 – 20 M MAD' },
  { value: '20m_100m', label: '20 – 100 M MAD' },
  { value: 'over_100m', label: '> 100 M MAD' },
];
