import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Lead, LeadListItem, CreateLeadRequest, UpdateLeadRequest } from '../../types/lead';
import leadsApi, { LeadsQueryParams } from '../../api/leads';
import { PageMeta } from '../../types/api';

interface LeadsState {
  items: LeadListItem[];
  selectedLead: Lead | null;
  loading: boolean;
  loadingDetail: boolean;
  error: string | null;
  pagination: PageMeta;
  filters: LeadsQueryParams;
}

const initialState: LeadsState = {
  items: [],
  selectedLead: null,
  loading: false,
  loadingDetail: true,
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
    sortDirection: 'desc',
  },
};

export const fetchLeads = createAsyncThunk(
  'leads/fetchAll',
  async (params: LeadsQueryParams, { rejectWithValue }) => {
    try {
      return await leadsApi.getAll(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors du chargement des pistes');
    }
  }
);

export const fetchLeadById = createAsyncThunk(
  'leads/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await leadsApi.getById(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors du chargement de la piste');
    }
  }
);

export const createLead = createAsyncThunk(
  'leads/create',
  async (data: CreateLeadRequest, { rejectWithValue }) => {
    try {
      return await leadsApi.create(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la création de la piste');
    }
  }
);

export const updateLead = createAsyncThunk(
  'leads/update',
  async ({ id, data }: { id: string; data: UpdateLeadRequest }, { rejectWithValue }) => {
    try {
      return await leadsApi.update(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la mise à jour de la piste');
    }
  }
);

export const deleteLead = createAsyncThunk(
  'leads/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await leadsApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la suppression de la piste');
    }
  }
);

const leadsSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<LeadsQueryParams>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearSelectedLead: (state) => {
      state.selectedLead = null;
      state.loadingDetail = true;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchLeads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.content;
        state.pagination = {
          page: action.payload.page,
          size: action.payload.size,
          totalElements: action.payload.totalElements,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch by ID
      .addCase(fetchLeadById.pending, (state) => {
        state.loadingDetail = true;
        state.error = null;
        state.selectedLead = null;
      })
      .addCase(fetchLeadById.fulfilled, (state, action) => {
        state.loadingDetail = false;
        state.selectedLead = action.payload;
      })
      .addCase(fetchLeadById.rejected, (state, action) => {
        state.loadingDetail = false;
        state.error = action.payload as string;
      })
      // Create
      .addCase(createLead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createLead.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createLead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update
      .addCase(updateLead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLead.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedLead = action.payload;
      })
      .addCase(updateLead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete
      .addCase(deleteLead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteLead.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(deleteLead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setFilters, clearFilters, clearSelectedLead, clearError } = leadsSlice.actions;
export default leadsSlice.reducer;
