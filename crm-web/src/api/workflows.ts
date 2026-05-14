import apiClient from './client';
import { ApiResponse, PagedResponse } from '../types/api';
import {
  Workflow,
  WorkflowListItem,
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  WorkflowExecution,
  WorkflowStats,
  WorkflowTemplate,
  WorkflowTemplateListItem,
} from '../types/workflow';

export interface WorkflowsQueryParams {
  page?: number;
  size?: number;
  search?: string;
  entityType?: string;
  isActive?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface ExecutionsQueryParams {
  page?: number;
  size?: number;
  workflowId?: string;
  status?: string;
  entityType?: string;
}

export const workflowsApi = {
  getAll: async (params: WorkflowsQueryParams = {}): Promise<PagedResponse<WorkflowListItem>> => {
    const backendParams = {
      page: params.page || 1,
      perPage: params.size || 20,
      search: params.search,
      entityType: params.entityType,
      isActive: params.isActive,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    };
    const response = await apiClient.get<ApiResponse<WorkflowListItem[]>>('/workflows', { params: backendParams });
    const meta = response.data.meta;
    return {
      content: response.data.data || [],
      page: meta?.page || 0,
      size: meta?.perPage || 20,
      totalElements: meta?.total || 0,
      totalPages: meta?.totalPages || 0,
      meta: {
        page: meta?.page || 0,
        size: meta?.perPage || 20,
        totalElements: meta?.total || 0,
        totalPages: meta?.totalPages || 0,
      },
    };
  },

  getById: async (id: string): Promise<Workflow> => {
    const response = await apiClient.get<ApiResponse<Workflow>>(`/workflows/${id}`);
    return response.data.data!;
  },

  create: async (data: CreateWorkflowRequest): Promise<Workflow> => {
    const response = await apiClient.post<ApiResponse<Workflow>>('/workflows', data);
    return response.data.data!;
  },

  update: async (id: string, data: UpdateWorkflowRequest): Promise<Workflow> => {
    const response = await apiClient.put<ApiResponse<Workflow>>(`/workflows/${id}`, data);
    return response.data.data!;
  },

  toggleActive: async (id: string): Promise<Workflow> => {
    const response = await apiClient.post<ApiResponse<Workflow>>(`/workflows/${id}/toggle`);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/workflows/${id}`);
  },

  execute: async (id: string, entityId: string): Promise<WorkflowExecution> => {
    const response = await apiClient.post<ApiResponse<WorkflowExecution>>(`/workflows/${id}/execute`, null, {
      params: { entityId },
    });
    return response.data.data!;
  },

  // Executions
  getExecutions: async (params: ExecutionsQueryParams = {}): Promise<PagedResponse<WorkflowExecution>> => {
    const backendParams = {
      page: params.page || 1,
      perPage: params.size || 20,
      workflowId: params.workflowId,
      status: params.status,
      entityType: params.entityType,
    };
    const response = await apiClient.get<ApiResponse<WorkflowExecution[]>>('/workflows/executions', {
      params: backendParams,
    });
    const meta = response.data.meta;
    return {
      content: response.data.data || [],
      page: meta?.page || 0,
      size: meta?.perPage || 20,
      totalElements: meta?.total || 0,
      totalPages: meta?.totalPages || 0,
      meta: {
        page: meta?.page || 0,
        size: meta?.perPage || 20,
        totalElements: meta?.total || 0,
        totalPages: meta?.totalPages || 0,
      },
    };
  },

  getExecution: async (id: string): Promise<WorkflowExecution> => {
    const response = await apiClient.get<ApiResponse<WorkflowExecution>>(`/workflows/executions/${id}`);
    return response.data.data!;
  },

  cancelExecution: async (id: string): Promise<WorkflowExecution> => {
    const response = await apiClient.post<ApiResponse<WorkflowExecution>>(`/workflows/executions/${id}/cancel`);
    return response.data.data!;
  },

  approveExecution: async (id: string, approved: boolean): Promise<void> => {
    await apiClient.post(`/workflows/executions/${id}/approve`, null, { params: { approved } });
  },

  // Stats
  getStats: async (): Promise<WorkflowStats> => {
    const response = await apiClient.get<ApiResponse<WorkflowStats>>('/workflows/stats');
    return response.data.data!;
  },

  // ── Templates ──────────────────────────────────────────────────────────────

  getTemplates: async (params: {
    page?: number;
    size?: number;
    search?: string;
    category?: string;
    entityType?: string;
  } = {}): Promise<PagedResponse<WorkflowTemplateListItem>> => {
    const backendParams = {
      page: params.page || 1,
      perPage: params.size || 50,
      search: params.search,
      category: params.category,
      entityType: params.entityType,
    };
    const response = await apiClient.get<ApiResponse<WorkflowTemplateListItem[]>>(
      '/workflows/templates',
      { params: backendParams }
    );
    const meta = response.data.meta;
    return {
      content: response.data.data || [],
      page: meta?.page || 0,
      size: meta?.perPage || 50,
      totalElements: meta?.total || 0,
      totalPages: meta?.totalPages || 0,
      meta: {
        page: meta?.page || 0,
        size: meta?.perPage || 50,
        totalElements: meta?.total || 0,
        totalPages: meta?.totalPages || 0,
      },
    };
  },

  getTemplate: async (id: string): Promise<WorkflowTemplate> => {
    const response = await apiClient.get<ApiResponse<WorkflowTemplate>>(
      `/workflows/templates/${id}`
    );
    return response.data.data!;
  },

  /**
   * Crée un workflow depuis un template.
   * @param templateId UUID du template
   * @param customName Nom personnalisé (optionnel)
   */
  useTemplate: async (templateId: string, customName?: string): Promise<Workflow> => {
    const body = customName ? { name: customName } : undefined;
    const response = await apiClient.post<ApiResponse<Workflow>>(
      `/workflows/templates/${templateId}/use`,
      body
    );
    return response.data.data!;
  },
};
