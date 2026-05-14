import apiClient from './client';
import type {
  Project, ProjectListItem, Milestone,
  Task, TaskListItem, TaskComment,
  CreateProjectPayload, UpdateProjectPayload,
  CreateTaskPayload, UpdateTaskPayload,
  TaskStatus, MemberRole,
} from '../types/project';

export interface ProjectFilters {
  status?: string;
  accountId?: string;
  managerId?: string;
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

export interface TaskFilters {
  projectId?: string;
  status?: string;
  assigneeId?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

export interface PageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export const projectsApi = {
  // ── Projets ──────────────────────────────────────────────────────────────

  getAll: async (filters: ProjectFilters = {}): Promise<PageResult<ProjectListItem>> => {
    const { data } = await apiClient.get('/projects', { params: filters });
    return data.data;
  },

  getById: async (id: string): Promise<Project> => {
    const { data } = await apiClient.get(`/projects/${id}`);
    return data.data;
  },

  create: async (payload: CreateProjectPayload): Promise<Project> => {
    const { data } = await apiClient.post('/projects', payload);
    return data.data;
  },

  update: async (id: string, payload: UpdateProjectPayload): Promise<Project> => {
    const { data } = await apiClient.put(`/projects/${id}`, payload);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },

  // ── Membres ───────────────────────────────────────────────────────────────

  addMember: async (projectId: string, userId: string, role?: MemberRole): Promise<Project> => {
    const { data } = await apiClient.post(`/projects/${projectId}/members`, null, {
      params: { userId, role },
    });
    return data.data;
  },

  removeMember: async (projectId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/members/${userId}`);
  },

  // ── Milestones ────────────────────────────────────────────────────────────

  createMilestone: async (
    projectId: string,
    payload: { name: string; description?: string; dueDate?: string; sortOrder?: number }
  ): Promise<Milestone> => {
    const { data } = await apiClient.post(`/projects/${projectId}/milestones`, payload);
    return data.data;
  },

  updateMilestone: async (
    milestoneId: string,
    payload: { name: string; description?: string; dueDate?: string; sortOrder?: number }
  ): Promise<Milestone> => {
    const { data } = await apiClient.put(`/projects/milestones/${milestoneId}`, payload);
    return data.data;
  },

  deleteMilestone: async (milestoneId: string): Promise<void> => {
    await apiClient.delete(`/projects/milestones/${milestoneId}`);
  },
};

export const tasksApi = {
  getAll: async (filters: TaskFilters = {}): Promise<PageResult<TaskListItem>> => {
    const { data } = await apiClient.get('/tasks', { params: filters });
    return data.data;
  },

  getByProject: async (projectId: string): Promise<TaskListItem[]> => {
    const { data } = await apiClient.get(`/tasks/project/${projectId}`);
    return data.data;
  },

  getMyTasks: async (): Promise<TaskListItem[]> => {
    const { data } = await apiClient.get('/tasks/my-tasks');
    return data.data;
  },

  getById: async (id: string): Promise<Task> => {
    const { data } = await apiClient.get(`/tasks/${id}`);
    return data.data;
  },

  create: async (payload: CreateTaskPayload): Promise<Task> => {
    const { data } = await apiClient.post('/tasks', payload);
    return data.data;
  },

  update: async (id: string, payload: UpdateTaskPayload): Promise<Task> => {
    const { data } = await apiClient.put(`/tasks/${id}`, payload);
    return data.data;
  },

  changeStatus: async (id: string, status: TaskStatus): Promise<Task> => {
    const { data } = await apiClient.patch(`/tasks/${id}/status`, null, { params: { status } });
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },

  addComment: async (id: string, content: string): Promise<TaskComment> => {
    const { data } = await apiClient.post(`/tasks/${id}/comments`, { content });
    return data.data;
  },
};
