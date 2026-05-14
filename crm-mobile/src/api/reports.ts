import apiClient from './client';

export interface CommercialStats {
  totalLeads: number;
  totalOpportunities: number;
  totalAccounts: number;
  totalVisits: number;
  totalActivities: number;
  wonOpportunities: number;
  lostOpportunities: number;
  conversionRate: number;
  totalRevenue: number;
  monthlyRevenue: number;
  visitsByType?: Record<string, number>;
  activitiesByType?: Record<string, number>;
}

export const reportsApi = {
  getMyStats: async (): Promise<CommercialStats> => {
    // Appelle plusieurs endpoints en parallèle pour construire les stats
    const [leads, opportunities, accounts, visits, activities] = await Promise.allSettled([
      apiClient.get('/leads', { params: { page: 1, perPage: 1 } }),
      apiClient.get('/opportunities', { params: { page: 1, perPage: 1 } }),
      apiClient.get('/accounts', { params: { page: 1, perPage: 1 } }),
      apiClient.get('/visits', { params: { page: 1, perPage: 1 } }),
      apiClient.get('/activities', { params: { page: 1, perPage: 1 } }),
    ]);
    const getMeta = (r: PromiseSettledResult<any>) =>
      r.status === 'fulfilled' ? r.value.data.meta : null;
    return {
      totalLeads: getMeta(leads)?.total || 0,
      totalOpportunities: getMeta(opportunities)?.total || 0,
      totalAccounts: getMeta(accounts)?.total || 0,
      totalVisits: getMeta(visits)?.total || 0,
      totalActivities: getMeta(activities)?.total || 0,
      wonOpportunities: 0,
      lostOpportunities: 0,
      conversionRate: 0,
      totalRevenue: 0,
      monthlyRevenue: 0,
    };
  },

  getVisitStats: async () => {
    const response = await apiClient.get('/visits', { params: { page: 1, perPage: 100 } });
    const visits = response.data.data || [];
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    visits.forEach((v: any) => {
      byType[v.visitType] = (byType[v.visitType] || 0) + 1;
      byStatus[v.status] = (byStatus[v.status] || 0) + 1;
    });
    return { byType, byStatus, total: visits.length };
  },
};

export default reportsApi;
