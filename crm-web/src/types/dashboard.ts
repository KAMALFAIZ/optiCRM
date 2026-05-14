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

export interface RepScore {
  userId: string;
  repName: string;
  score: number;
  revenueScore: number;
  winRateScore: number;
  visitCompletionScore: number;
  visitFrequencyScore: number;
  pipelineScore: number;
  revenue: number;
  winRate: number;
  visitCompletionRate: number;
  totalVisits: number;
  pipelineValue: number;
}

export interface SupervisionAlert {
  userId: string;
  repName: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  code: string;
  message: string;
  value: number;
  threshold: number;
}

export interface TeamBenchmark {
  avgRevenue: number;
  avgWinRate: number;
  avgDealSize: number;
  avgPipeline: number;
  avgVisits: number;
  avgVisitCompletionRate: number;
  avgMileage: number;
  avgExpenses: number;
  totalReps: number;
}

export interface RepBenchmark {
  userId: string;
  repName: string;
  revenue: number;
  revenueDeviation: number;
  winRate: number;
  winRateDeviation: number;
  averageDealSize: number;
  dealSizeDeviation: number;
  pipelineValue: number;
  pipelineDeviation: number;
  totalVisits: number;
  visitsDeviation: number;
  visitCompletionRate: number;
  visitCompletionDeviation: number;
}

export interface SupervisionData {
  scores: RepScore[];
  alerts: SupervisionAlert[];
  teamAverageScore: number;
  teamBenchmark: TeamBenchmark | null;
  repBenchmarks: RepBenchmark[];
}

export interface MonthlyTrend {
  month: string;
  revenue: number;
  dealsWon: number;
  dealsLost: number;
  winRate: number;
  pipeline: number;
  newDeals: number;
  visits: number;
  completedVisits: number;
  visitCompletionRate: number;
}

export interface RepTrend {
  userId: string;
  repName: string;
  months: MonthlyTrend[];
}

export interface TrendData {
  teamTrend: MonthlyTrend[];
  repTrends: RepTrend[];
  monthsIncluded: number;
}

// Supervisor assignments
export interface SupervisorAssignment {
  id: string;
  supervisorId: string;
  supervisorName: string;
  collaboratorId: string;
  collaboratorName: string;
  collaboratorEmail: string;
  collaboratorRole: string;
  assignedAt: string;
  notes: string | null;
  active: boolean;
}

export interface CollaboratorSummary {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  alreadyAssigned: boolean;
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
  // Terrain
  totalVisits: number;
  completedVisits: number;
  plannedVisits: number;
  inProgressVisits: number;
  visitCompletionRate: number;
  totalMileage: number;
  totalExpenses: number;
}
