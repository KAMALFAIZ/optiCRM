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
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  fullAddress?: string;
  status: string;
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
  assignedTo?: { id: string; fullName: string; email: string };
  territory?: { id: string; name: string; region?: string };
  campaignId?: string;
  isConverted?: boolean;
  convertedAt?: string;
  convertedContactId?: string;
  convertedAccountId?: string;
  convertedOpportunityId?: string;
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
  linkedinUrl?: string;
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
  priority?: string;
  doNotCall?: boolean;
  doNotEmail?: boolean;
  nextFollowUpDate?: string;
  description?: string;
  assignedToId?: string;
  territoryId?: string;
  campaignId?: string;
}

export type UpdateLeadRequest = Partial<CreateLeadRequest>;

export interface LeadScoreDto {
  score: number;
  label: string;
  color: string;
  breakdown: LeadScoreBreakdown;
}

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

export const LEAD_STATUSES = [
  { value: 'new', label: 'Nouveau', color: '#1976D2' },
  { value: 'contacted', label: 'Contacté', color: '#00BCD4' },
  { value: 'qualified', label: 'Qualifié', color: '#4CAF50' },
  { value: 'unqualified', label: 'Non qualifié', color: '#F44336' },
  { value: 'nurturing', label: 'En nurturing', color: '#9C27B0' },
  { value: 'converted', label: 'Converti', color: '#FFC107' },
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
  { value: 'hot', label: 'Chaud', color: '#F44336' },
  { value: 'warm', label: 'Tiède', color: '#FF9800' },
  { value: 'cold', label: 'Froid', color: '#2196F3' },
];
