export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  category?: string;
  availableVariables?: string;
  usageCount: number;
  openRate?: number;
  clickRate?: number;
  isActive: boolean;
  createdBy?: { id: string; fullName: string };
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplateListItem {
  id: string;
  name: string;
  subject: string;
  category?: string;
  isActive: boolean;
  usageCount: number;
  openRate?: number;
  clickRate?: number;
  createdByName?: string;
  updatedAt?: string;
}

export interface CreateEmailTemplateRequest {
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  category?: string;
  availableVariables?: string;
}

export interface UpdateEmailTemplateRequest {
  name?: string;
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
  category?: string;
  availableVariables?: string;
}

export const EMAIL_CATEGORIES = [
  { value: 'commercial', label: 'Commercial' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'support', label: 'Support' },
  { value: 'notification', label: 'Notification' },
  { value: 'relance', label: 'Relance' },
  { value: 'other', label: 'Autre' },
];

export const EMAIL_CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  commercial: { label: 'Commercial', color: 'blue' },
  marketing: { label: 'Marketing', color: 'purple' },
  support: { label: 'Support', color: 'cyan' },
  notification: { label: 'Notification', color: 'orange' },
  relance: { label: 'Relance', color: 'green' },
  other: { label: 'Autre', color: 'default' },
};
