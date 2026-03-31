import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { workflowsApi, WorkflowsQueryParams, ExecutionsQueryParams } from '@/api/workflows';
import {
  Workflow,
  WorkflowListItem,
  WorkflowExecution,
  WorkflowStats,
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  WorkflowTemplate,
  WorkflowTemplateListItem,
} from '@/types/workflow';

interface WorkflowsState {
  items: WorkflowListItem[];
  selectedWorkflow: Workflow | null;
  executions: WorkflowExecution[];
  selectedExecution: WorkflowExecution | null;
  stats: WorkflowStats | null;
  loading: boolean;
  executionsLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  executionsPagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  filters: {
    search?: string;
    entityType?: string;
    isActive?: boolean;
  };
  // Templates
  templates: WorkflowTemplateListItem[];
  selectedTemplate: WorkflowTemplate | null;
  templatesLoading: boolean;
  templatesPagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  templateFilters: {
    search?: string;
    category?: string;
    entityType?: string;
  };
}

const initialState: WorkflowsState = {
  items: [],
  selectedWorkflow: null,
  executions: [],
  selectedExecution: null,
  stats: null,
  loading: false,
  executionsLoading: false,
  error: null,
  pagination: { page: 1, size: 20, totalElements: 0, totalPages: 0 },
  executionsPagination: { page: 1, size: 20, totalElements: 0, totalPages: 0 },
  filters: {},
  // Templates
  templates: [],
  selectedTemplate: null,
  templatesLoading: false,
  templatesPagination: { page: 1, size: 50, totalElements: 0, totalPages: 0 },
  templateFilters: {},
};

// ── Async thunks ─────────────────────────────────────────────────────────

export const fetchWorkflows = createAsyncThunk(
  'workflows/fetchAll',
  async (params: WorkflowsQueryParams, { rejectWithValue }) => {
    try {
      return await workflowsApi.getAll(params);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message || 'Erreur lors du chargement des workflows');
    }
  }
);

export const fetchWorkflowById = createAsyncThunk(
  'workflows/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await workflowsApi.getById(id);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message || 'Workflow introuvable');
    }
  }
);

export const createWorkflow = createAsyncThunk(
  'workflows/create',
  async (data: CreateWorkflowRequest, { rejectWithValue }) => {
    try {
      return await workflowsApi.create(data);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message || 'Erreur lors de la création');
    }
  }
);

export const updateWorkflow = createAsyncThunk(
  'workflows/update',
  async ({ id, data }: { id: string; data: UpdateWorkflowRequest }, { rejectWithValue }) => {
    try {
      return await workflowsApi.update(id, data);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message || 'Erreur lors de la mise à jour');
    }
  }
);

export const toggleWorkflowActive = createAsyncThunk(
  'workflows/toggle',
  async (id: string, { rejectWithValue }) => {
    try {
      return await workflowsApi.toggleActive(id);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message || 'Erreur');
    }
  }
);

export const deleteWorkflow = createAsyncThunk(
  'workflows/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await workflowsApi.delete(id);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message || 'Erreur lors de la suppression');
    }
  }
);

export const fetchExecutions = createAsyncThunk(
  'workflows/fetchExecutions',
  async (params: ExecutionsQueryParams, { rejectWithValue }) => {
    try {
      return await workflowsApi.getExecutions(params);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message || 'Erreur');
    }
  }
);

export const fetchExecutionById = createAsyncThunk(
  'workflows/fetchExecution',
  async (id: string, { rejectWithValue }) => {
    try {
      return await workflowsApi.getExecution(id);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message || 'Exécution introuvable');
    }
  }
);

export const fetchWorkflowStats = createAsyncThunk(
  'workflows/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      return await workflowsApi.getStats();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message || 'Erreur');
    }
  }
);

// ── Templates thunks ──────────────────────────────────────────────────────

export const fetchTemplates = createAsyncThunk(
  'workflows/fetchTemplates',
  async (params: { page?: number; size?: number; search?: string; category?: string; entityType?: string }, { rejectWithValue }) => {
    try {
      return await workflowsApi.getTemplates(params);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message || 'Erreur lors du chargement des templates');
    }
  }
);

export const fetchTemplateById = createAsyncThunk(
  'workflows/fetchTemplateById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await workflowsApi.getTemplate(id);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message || 'Template introuvable');
    }
  }
);

export const useTemplate = createAsyncThunk(
  'workflows/useTemplate',
  async ({ templateId, customName }: { templateId: string; customName?: string }, { rejectWithValue }) => {
    try {
      return await workflowsApi.useTemplate(templateId, customName);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message || 'Erreur lors de la création depuis le template');
    }
  }
);

// ── Slice ────────────────────────────────────────────────────────────────

const workflowsSlice = createSlice({
  name: 'workflows',
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<WorkflowsState['filters']>) {
      state.filters = action.payload;
    },
    clearFilters(state) {
      state.filters = {};
    },
    clearSelectedWorkflow(state) {
      state.selectedWorkflow = null;
    },
    clearSelectedExecution(state) {
      state.selectedExecution = null;
    },
    clearError(state) {
      state.error = null;
    },
    setTemplateFilters(state, action: PayloadAction<WorkflowsState['templateFilters']>) {
      state.templateFilters = action.payload;
    },
    clearTemplateFilters(state) {
      state.templateFilters = {};
    },
    clearSelectedTemplate(state) {
      state.selectedTemplate = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchWorkflows.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchWorkflows.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.content;
        state.pagination = {
          page: action.payload.page,
          size: action.payload.size,
          totalElements: action.payload.totalElements,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchWorkflows.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch by ID
      .addCase(fetchWorkflowById.pending, (state) => { state.loading = true; })
      .addCase(fetchWorkflowById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedWorkflow = action.payload;
      })
      .addCase(fetchWorkflowById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create
      .addCase(createWorkflow.fulfilled, (state, action) => {
        state.selectedWorkflow = action.payload;
      })
      // Update
      .addCase(updateWorkflow.fulfilled, (state, action) => {
        state.selectedWorkflow = action.payload;
      })
      // Toggle
      .addCase(toggleWorkflowActive.fulfilled, (state, action) => {
        const idx = state.items.findIndex(i => i.id === action.payload.id);
        if (idx >= 0) {
          state.items[idx].isActive = action.payload.isActive;
        }
        if (state.selectedWorkflow?.id === action.payload.id) {
          state.selectedWorkflow.isActive = action.payload.isActive;
        }
      })
      // Delete
      .addCase(deleteWorkflow.fulfilled, (state, action) => {
        state.items = state.items.filter(i => i.id !== action.payload);
      })
      // Executions
      .addCase(fetchExecutions.pending, (state) => { state.executionsLoading = true; })
      .addCase(fetchExecutions.fulfilled, (state, action) => {
        state.executionsLoading = false;
        state.executions = action.payload.content;
        state.executionsPagination = {
          page: action.payload.page,
          size: action.payload.size,
          totalElements: action.payload.totalElements,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchExecutions.rejected, (state, action) => {
        state.executionsLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchExecutionById.fulfilled, (state, action) => {
        state.selectedExecution = action.payload;
      })
      // Stats
      .addCase(fetchWorkflowStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      // Templates
      .addCase(fetchTemplates.pending, (state) => { state.templatesLoading = true; state.error = null; })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.templatesLoading = false;
        state.templates = action.payload.content;
        state.templatesPagination = {
          page: action.payload.page,
          size: action.payload.size,
          totalElements: action.payload.totalElements,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.templatesLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchTemplateById.fulfilled, (state, action) => {
        state.selectedTemplate = action.payload;
      })
      // useTemplate → ajoute le nouveau workflow à la liste
      .addCase(useTemplate.fulfilled, (state, action) => {
        // Incrémenter usageCount du template dans la liste locale
        const tplId = (action.meta.arg as any).templateId;
        const tplIdx = state.templates.findIndex(t => t.id === tplId);
        if (tplIdx >= 0) {
          state.templates[tplIdx] = {
            ...state.templates[tplIdx],
            usageCount: state.templates[tplIdx].usageCount + 1,
          };
        }
      });
  },
});

export const {
  setFilters,
  clearFilters,
  clearSelectedWorkflow,
  clearSelectedExecution,
  clearError,
  setTemplateFilters,
  clearTemplateFilters,
  clearSelectedTemplate,
} = workflowsSlice.actions;
export default workflowsSlice.reducer;
