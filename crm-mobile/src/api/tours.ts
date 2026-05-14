import apiClient from './client';

export interface TourListItem {
  id: string;
  name: string;
  tourDate: string;
  status: 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled';
  region?: string;
  totalVisits: number;
  completedVisits: number;
  totalDistance?: number;
  assignedToName?: string;
  assignedToId?: string;
  objective?: string;
}

export interface Tour extends TourListItem {
  description?: string;
  startAddress?: string;
  endAddress?: string;
  notes?: string;
  tourResult?: string;
  estimatedRevenue?: number;
  actualRevenue?: number;
  vehicleType?: string;
  fuelCost?: number;
  totalExpenses?: number;
  startTime?: string;
  endTime?: string;
  followUpNotes?: string;
  visits?: any[];
}

export interface CreateTourRequest {
  name: string;
  description?: string;
  tourDate: string;
  region?: string;
  objective?: string;
  vehicleType?: string;
  startAddress?: string;
  assignedToId?: string;
}

export interface ToursQueryParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
  assignedToId?: string;
}

export const toursApi = {
  getAll: async (params: ToursQueryParams = {}) => {
    const response = await apiClient.get('/tours', {
      params: { page: params.page || 1, perPage: params.perPage || 20, ...params },
    });
    return { content: response.data.data || [], meta: response.data.meta };
  },
  getById: async (id: string): Promise<Tour> => {
    const response = await apiClient.get(`/tours/${id}`);
    return response.data.data;
  },
  create: async (data: CreateTourRequest): Promise<Tour> => {
    const response = await apiClient.post('/tours', data);
    return response.data.data;
  },
  update: async (id: string, data: Partial<CreateTourRequest>): Promise<Tour> => {
    const response = await apiClient.put(`/tours/${id}`, data);
    return response.data.data;
  },
  start: async (id: string): Promise<Tour> => {
    const response = await apiClient.patch(`/tours/${id}/start`);
    return response.data.data;
  },
  complete: async (id: string): Promise<Tour> => {
    const response = await apiClient.patch(`/tours/${id}/complete`);
    return response.data.data;
  },
};
export default toursApi;
