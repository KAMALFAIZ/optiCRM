import apiClient from './client';
import { ApiResponse } from '../types/api';
import { AgedBalanceRow } from '../types/agedBalance';

const agedBalanceApi = {
  /**
   * Récupère la balance âgée de toutes les créances ouvertes.
   * @param commercialId  UUID du commercial (optionnel — null = tous les commerciaux)
   */
  getAll: async (commercialId?: string | null): Promise<AgedBalanceRow[]> => {
    const params: Record<string, string> = {};
    if (commercialId) params.commercialId = commercialId;

    const response = await apiClient.get<ApiResponse<AgedBalanceRow[]>>(
      '/finance/aged-balance',
      { params }
    );
    return response.data.data || [];
  },
};

export default agedBalanceApi;
