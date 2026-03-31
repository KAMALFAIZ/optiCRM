import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import campaignsApi, { CampaignFilters } from '@/api/campaigns';
import {
  Campaign,
  CampaignListItem,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CampaignStatus,
  CampaignType,
} from '@/types/campaign';

interface CampaignsState {
  campaigns: CampaignListItem[];
  selectedCampaign: Campaign | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  filters: {
    status?: CampaignStatus;
    type?: CampaignType;
    search?: string;
    page: number;
    size: number;
    sortBy: string;
    sortDir: 'asc' | 'desc';
  };
}

const initialState: CampaignsState = {
  campaigns: [],
  selectedCampaign: null,
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

export const fetchCampaigns = createAsyncThunk(
  'campaigns/fetchCampaigns',
  async (filters: CampaignFilters) => {
    const response = await campaignsApi.getAll(filters);
    return response.data;
  }
);

export const fetchCampaignById = createAsyncThunk(
  'campaigns/fetchCampaignById',
  async (id: string) => {
    const response = await campaignsApi.getById(id);
    return response.data;
  }
);

export const createCampaign = createAsyncThunk(
  'campaigns/createCampaign',
  async (data: CreateCampaignRequest, { rejectWithValue }) => {
    try {
      const response = await campaignsApi.create(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la création');
    }
  }
);

export const updateCampaign = createAsyncThunk(
  'campaigns/updateCampaign',
  async ({ id, data }: { id: string; data: UpdateCampaignRequest }, { rejectWithValue }) => {
    try {
      const response = await campaignsApi.update(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  }
);

export const deleteCampaign = createAsyncThunk(
  'campaigns/deleteCampaign',
  async (id: string, { rejectWithValue }) => {
    try {
      await campaignsApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la suppression');
    }
  }
);

const campaignsSlice = createSlice({
  name: 'campaigns',
  initialState,
  reducers: {
    setCampaignFilters: (state, action: PayloadAction<Partial<CampaignsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearCampaignFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearSelectedCampaign: (state) => {
      state.selectedCampaign = null;
    },
    clearCampaignError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch campaigns
      .addCase(fetchCampaigns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.campaigns = action.payload.content;
          state.pagination = {
            page: action.payload.page,
            size: action.payload.size,
            totalElements: action.payload.totalElements,
            totalPages: action.payload.totalPages,
          };
        }
      })
      .addCase(fetchCampaigns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erreur lors du chargement des campagnes';
      })
      // Fetch campaign by ID
      .addCase(fetchCampaignById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCampaignById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCampaign = action.payload ?? null;
      })
      .addCase(fetchCampaignById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erreur lors du chargement de la campagne';
      })
      // Create campaign
      .addCase(createCampaign.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCampaign.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createCampaign.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update campaign
      .addCase(updateCampaign.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCampaign.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCampaign = action.payload ?? null;
      })
      .addCase(updateCampaign.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete campaign
      .addCase(deleteCampaign.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCampaign.fulfilled, (state, action) => {
        state.loading = false;
        state.campaigns = state.campaigns.filter((c) => c.id !== action.payload);
      })
      .addCase(deleteCampaign.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCampaignFilters, clearCampaignFilters, clearSelectedCampaign, clearCampaignError } =
  campaignsSlice.actions;
export default campaignsSlice.reducer;
