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
