export type CampaignType = 'email' | 'event' | 'webinar' | 'social' | 'ads' | 'telemarketing' | 'other';

export type CampaignStatus = 'draft' | 'planned' | 'active' | 'paused' | 'completed' | 'cancelled';

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  type?: CampaignType;
  status: CampaignStatus;
  startDate?: string;
  endDate?: string;
  budget?: number;
  actualCost?: number;
  expectedRevenue?: number;
  roi?: number;
  createdByName?: string;
  leadsGenerated: number;
  opportunitiesGenerated: number;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignListItem {
  id: string;
  name: string;
  type?: CampaignType;
  status: CampaignStatus;
  startDate?: string;
  endDate?: string;
  budget?: number;
  actualCost?: number;
  expectedRevenue?: number;
  roi?: number;
  leadsGenerated: number;
  opportunitiesGenerated?: number;
  createdByName?: string;
}

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  actualCost?: number;
  expectedRevenue?: number;
}

export interface UpdateCampaignRequest {
  name?: string;
  description?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  actualCost?: number;
  expectedRevenue?: number;
}

export const CAMPAIGN_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  email: { label: 'Email', color: 'blue' },
  event: { label: 'Événement', color: 'purple' },
  webinar: { label: 'Webinaire', color: 'cyan' },
  social: { label: 'Réseaux sociaux', color: 'orange' },
  ads: { label: 'Publicité', color: 'red' },
  telemarketing: { label: 'Télémarketing', color: 'green' },
  other: { label: 'Autre', color: 'default' },
};

export const CAMPAIGN_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: 'default' },
  planned: { label: 'Planifiée', color: 'blue' },
  active: { label: 'Active', color: 'green' },
  paused: { label: 'En pause', color: 'orange' },
  completed: { label: 'Terminée', color: 'purple' },
  cancelled: { label: 'Annulée', color: 'default' },
};
