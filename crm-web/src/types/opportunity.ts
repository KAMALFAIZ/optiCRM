export interface OpportunityStage {
  id: string;
  name: string;
  code: string;
  probability: number;
  sortOrder: number;
  isClosed: boolean;
  isWon: boolean;
  color: string;
}

export interface Opportunity {
  id: string;
  name: string;
  amount?: number;
  currency: string;
  probability: number;
  weightedAmount?: number;
  stage: OpportunityStage;
  stageChangedAt?: string;
  closeDate?: string;
  actualCloseDate?: string;
  type?: string;
  leadSource?: string;
  account: {
    id: string;
    name: string;
    accountType: string;
  };
  primaryContact?: {
    id: string;
    fullName: string;
    email?: string;
    phone?: string;
  };
  assignedTo?: {
    id: string;
    fullName: string;
    email: string;
  };
  leadId?: string;
  campaignId?: string;
  isWon?: boolean;
  isClosed: boolean;
  closeReason?: string;
  competitorId?: string;
  description?: string;
  nextStep?: string;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface OpportunityListItem {
  id: string;
  name: string;
  amount?: number;
  currency: string;
  probability: number;
  weightedAmount?: number;
  stageId: string;
  stageName: string;
  stageColor: string;
  stageProbability?: number;
  stageChangedAt?: string;
  forecastCategory?: 'COMMIT' | 'BEST_CASE' | 'PIPELINE';
  nextFollowupDate?: string;
  competitorName?: string;
  isClosed: boolean;
  isWon?: boolean;
  closeDate?: string;
  accountId: string;
  accountName: string;
  primaryContactId?: string;
  primaryContactName?: string;
  assignedToId?: string;
  assignedToName?: string;
  createdAt: string;
}

export interface PipelineStageData {
  id: string;
  name: string;
  code: string;
  color: string;
  sortOrder: number;
  probability: number;
  isClosed: boolean;
  isWon: boolean;
  opportunities: OpportunityListItem[];
  count: number;
  totalAmount: number;
  weightedAmount: number;
}

export interface PipelineSummary {
  stages: PipelineStageData[];
  totalPipeline: number;
  totalWeighted: number;
  commitAmount: number;
  bestCaseAmount: number;
  pipelineAmount: number;
  totalCount: number;
}

export interface CreateOpportunityRequest {
  name: string;
  amount?: number;
  currency?: string;
  probability?: number;
  stageId: string;
  closeDate?: string;
  type?: string;
  leadSource?: string;
  accountId: string;
  primaryContactId?: string;
  assignedToId?: string;
  leadId?: string;
  campaignId?: string;
  description?: string;
  nextStep?: string;
  tags?: string[];
}

export interface UpdateOpportunityRequest extends Partial<CreateOpportunityRequest> {
  isClosed?: boolean;
  isWon?: boolean;
  closeReason?: string;
  competitorId?: string;
}

export const OPPORTUNITY_TYPES = [
  { value: 'new_business', label: 'Nouvelle affaire' },
  { value: 'existing_business', label: 'Client existant' },
  { value: 'renewal', label: 'Renouvellement' },
  { value: 'upsell', label: 'Montée en gamme' },
  { value: 'cross_sell', label: 'Vente croisée' },
];

export const CLOSE_REASONS = [
  { value: 'won', label: 'Gagné' },
  { value: 'lost_price', label: 'Perdu - Prix' },
  { value: 'lost_competitor', label: 'Perdu - Concurrent' },
  { value: 'lost_no_budget', label: 'Perdu - Pas de budget' },
  { value: 'lost_no_decision', label: 'Perdu - Pas de décision' },
  { value: 'lost_timing', label: 'Perdu - Timing' },
  { value: 'lost_other', label: 'Perdu - Autre' },
];
