import apiClient from './client';
import { ApiResponse } from '@/types/api';
import { SupervisorAssignment, CollaboratorSummary } from '@/types/dashboard';

export const supervisorApi = {
  getMyCollaborators: async (): Promise<SupervisorAssignment[]> => {
    const response = await apiClient.get<ApiResponse<SupervisorAssignment[]>>('/supervisor/collaborators');
    return response.data.data ?? [];
  },

  assignCollaborator: async (collaboratorId: string, notes?: string): Promise<SupervisorAssignment> => {
    const response = await apiClient.post<ApiResponse<SupervisorAssignment>>('/supervisor/collaborators', {
      collaboratorId,
      notes,
    });
    return response.data.data!;
  },

  unassignCollaborator: async (collaboratorId: string): Promise<void> => {
    await apiClient.delete(`/supervisor/collaborators/${collaboratorId}`);
  },

  getAssignableUsers: async (): Promise<CollaboratorSummary[]> => {
    const response = await apiClient.get<ApiResponse<CollaboratorSummary[]>>('/supervisor/assignable-users');
    return response.data.data ?? [];
  },

  // Admin endpoints
  getCollaboratorsFor: async (supervisorId: string): Promise<SupervisorAssignment[]> => {
    const response = await apiClient.get<ApiResponse<SupervisorAssignment[]>>(`/supervisor/admin/${supervisorId}/collaborators`);
    return response.data.data ?? [];
  },

  assignCollaboratorFor: async (supervisorId: string, collaboratorId: string, notes?: string): Promise<SupervisorAssignment> => {
    const response = await apiClient.post<ApiResponse<SupervisorAssignment>>(`/supervisor/admin/${supervisorId}/collaborators`, {
      collaboratorId,
      notes,
    });
    return response.data.data!;
  },

  unassignCollaboratorFor: async (supervisorId: string, collaboratorId: string): Promise<void> => {
    await apiClient.delete(`/supervisor/admin/${supervisorId}/collaborators/${collaboratorId}`);
  },
};

export default supervisorApi;
