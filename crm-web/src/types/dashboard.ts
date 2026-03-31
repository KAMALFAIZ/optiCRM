export interface RevenueByMonth {
  month: string;
  amount: number;
}

export interface DashboardStats {
  totalAccounts: number;
  totalContacts: number;
  totalLeads: number;
  totalOpportunities: number;
  pipelineTotal: number;
  pipelineWeighted: number;
  wonThisMonth: number;
  wonThisYear: number;
  revenueThisMonth: number;
  revenueThisYear: number;
  conversionRate: number;
  leadsBySource: Record<string, number>;
  revenueByMonth: RevenueByMonth[];
}

export interface MonthlyForecast {
  month: string;
  pipeline: number;
  weighted: number;
  won: number;
  opportunityCount: number;
}

export interface RepForecast {
  repName: string;
  pipeline: number;
  weighted: number;
  won: number;
  opportunityCount: number;
  winRate: number;
}

export interface CommercialKpi {
  repName: string;
  revenue: number;
  dealsWon: number;
  dealsLost: number;
  winRate: number;
  averageDealSize: number;
  pipeline: number;
  openDeals: number;
}
