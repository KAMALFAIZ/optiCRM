export interface Contact {
  id: string;
  salutation?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  phoneMobile?: string;
  phoneOffice?: string;
  jobTitle?: string;
  department?: string;
  status?: string;
  preferredContactMethod?: string;
  mailingStreet?: string;
  mailingCity?: string;
  mailingState?: string;
  mailingPostalCode?: string;
  mailingCountry?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressPostalCode?: string;
  addressCountry?: string;
  fullAddress?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
  dateOfBirth?: string;
  preferredLanguage?: string;
  doNotCall?: boolean;
  doNotEmail?: boolean;
  description?: string;
  account?: { id: string; name: string; accountType: string };
  contactRole?: string;
  reportsTo?: { id: string; fullName: string; jobTitle?: string };
  assignedTo?: { id: string; fullName: string; email: string };
  createdAt: string;
  updatedAt?: string;
}

export interface ContactListItem {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phoneOffice?: string;
  phoneMobile?: string;
  status?: string;
  jobTitle?: string;
  addressCity?: string;
  accountId?: string;
  accountName?: string;
  assignedToName?: string;
  contactRole?: string;
}

export interface CreateContactRequest {
  salutation?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneMobile?: string;
  phoneOffice?: string;
  jobTitle?: string;
  department?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressPostalCode?: string;
  addressCountry?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
  dateOfBirth?: string;
  preferredLanguage?: string;
  doNotCall?: boolean;
  doNotEmail?: boolean;
  accountId?: string;
  contactRole?: string;
  reportsToId?: string;
  assignedToId?: string;
}

export type UpdateContactRequest = Partial<CreateContactRequest>;

export const SALUTATIONS = [
  { value: 'M.', label: 'M.' },
  { value: 'Mme', label: 'Mme' },
  { value: 'Dr.', label: 'Dr.' },
  { value: 'Pr.', label: 'Pr.' },
  { value: 'Me', label: 'Me' },
];

export const CONTACT_STATUSES = [
  { value: 'Actif', label: 'Actif', color: 'green' },
  { value: 'Inactif', label: 'Inactif', color: 'default' },
  { value: 'Archivé', label: 'Archivé', color: 'red' },
];

export const CONTACT_ROLES = [
  { value: 'decision_maker', label: 'Décideur' },
  { value: 'influencer', label: 'Influenceur' },
  { value: 'evaluator', label: 'Évaluateur' },
  { value: 'user', label: 'Utilisateur' },
  { value: 'technical', label: 'Contact technique' },
  { value: 'billing', label: 'Contact facturation' },
];
