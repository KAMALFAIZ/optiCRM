import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import emailTemplatesApi, { EmailTemplateFilters } from '@/api/emailTemplates';
import {
  EmailTemplate,
  EmailTemplateListItem,
  CreateEmailTemplateRequest,
  UpdateEmailTemplateRequest,
} from '@/types/emailTemplate';

interface EmailTemplatesState {
  emailTemplates: EmailTemplateListItem[];
  selectedEmailTemplate: EmailTemplate | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  filters: {
    category?: string;
    isActive?: boolean;
    search?: string;
    page: number;
    size: number;
    sortBy: string;
    sortDir: 'asc' | 'desc';
  };
}

const initialState: EmailTemplatesState = {
  emailTemplates: [],
  selectedEmailTemplate: null,
  loading: false,
  error: null,
  pagination: {
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  },
  filters: {
    page: 0,
    size: 20,
    sortBy: 'createdAt',
    sortDir: 'desc',
  },
};

export const fetchEmailTemplates = createAsyncThunk(
  'emailTemplates/fetchEmailTemplates',
  async (filters: EmailTemplateFilters) => {
    const response = await emailTemplatesApi.getAll(filters);
    return response.data;
  }
);

export const fetchEmailTemplateById = createAsyncThunk(
  'emailTemplates/fetchEmailTemplateById',
  async (id: string) => {
    const response = await emailTemplatesApi.getById(id);
    return response.data;
  }
);

export const createEmailTemplate = createAsyncThunk(
  'emailTemplates/createEmailTemplate',
  async (data: CreateEmailTemplateRequest, { rejectWithValue }) => {
    try {
      const response = await emailTemplatesApi.create(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la création');
    }
  }
);

export const updateEmailTemplate = createAsyncThunk(
  'emailTemplates/updateEmailTemplate',
  async ({ id, data }: { id: string; data: UpdateEmailTemplateRequest }, { rejectWithValue }) => {
    try {
      const response = await emailTemplatesApi.update(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  }
);

export const deleteEmailTemplate = createAsyncThunk(
  'emailTemplates/deleteEmailTemplate',
  async (id: string, { rejectWithValue }) => {
    try {
      await emailTemplatesApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la suppression');
    }
  }
);

export const toggleEmailTemplateActive = createAsyncThunk(
  'emailTemplates/toggleEmailTemplateActive',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await emailTemplatesApi.toggleActive(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors du changement de statut');
    }
  }
);

const emailTemplatesSlice = createSlice({
  name: 'emailTemplates',
  initialState,
  reducers: {
    setEmailTemplateFilters: (state, action: PayloadAction<Partial<EmailTemplatesState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearEmailTemplateFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearSelectedEmailTemplate: (state) => {
      state.selectedEmailTemplate = null;
    },
    clearEmailTemplateError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch email templates
      .addCase(fetchEmailTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmailTemplates.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.emailTemplates = action.payload.content;
          state.pagination = {
            page: action.payload.page,
            size: action.payload.size,
            totalElements: action.payload.totalElements,
            totalPages: action.payload.totalPages,
          };
        }
      })
      .addCase(fetchEmailTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erreur lors du chargement des modèles';
      })
      // Fetch email template by ID
      .addCase(fetchEmailTemplateById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmailTemplateById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedEmailTemplate = action.payload ?? null;
      })
      .addCase(fetchEmailTemplateById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erreur lors du chargement du modèle';
      })
      // Create email template
      .addCase(createEmailTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEmailTemplate.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createEmailTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update email template
      .addCase(updateEmailTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEmailTemplate.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedEmailTemplate = action.payload ?? null;
      })
      .addCase(updateEmailTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete email template
      .addCase(deleteEmailTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteEmailTemplate.fulfilled, (state, action) => {
        state.loading = false;
        state.emailTemplates = state.emailTemplates.filter((t) => t.id !== action.payload);
      })
      .addCase(deleteEmailTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Toggle active
      .addCase(toggleEmailTemplateActive.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleEmailTemplateActive.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          const index = state.emailTemplates.findIndex((t) => t.id === action.payload!.id);
          if (index !== -1) {
            state.emailTemplates[index].isActive = action.payload.isActive;
          }
        }
      })
      .addCase(toggleEmailTemplateActive.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setEmailTemplateFilters,
  clearEmailTemplateFilters,
  clearSelectedEmailTemplate,
  clearEmailTemplateError,
} = emailTemplatesSlice.actions;
export default emailTemplatesSlice.reducer;
