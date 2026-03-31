import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { opportunitiesApi, OpportunitiesQueryParams } from '@/api/opportunities';
import {
  Opportunity,
  OpportunityListItem,
  OpportunityStage,
  CreateOpportunityRequest,
  UpdateOpportunityRequest
} from '@/types/opportunity';
import { PageMeta } from '@/types/api';

interface OpportunitiesState {
  items: OpportunityListItem[];
  currentOpportunity: Opportunity | null;
  stages: OpportunityStage[];
  meta: PageMeta | null;
  loading: boolean;
  stagesLoading: boolean;
  error: string | null;
  queryParams: OpportunitiesQueryParams;
}

const initialState: OpportunitiesState = {
  items: [],
  currentOpportunity: null,
  stages: [],
  meta: null,
  loading: false,
  stagesLoading: false,
  error: null,
  queryParams: {
    page: 1,
    size: 20,
    sortBy: 'createdAt',
    sortDirection: 'desc',
  },
};

export const fetchOpportunities = createAsyncThunk(
  'opportunities/fetchAll',
  async (params: OpportunitiesQueryParams, { rejectWithValue }) => {
    try {
      return await opportunitiesApi.getAll(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Erreur lors du chargement des opportunités');
    }
  }
);

export const fetchOpportunityById = createAsyncThunk(
  'opportunities/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await opportunitiesApi.getById(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Opportunité non trouvée');
    }
  }
);

export const fetchOpportunityStages = createAsyncThunk(
  'opportunities/fetchStages',
  async (_, { rejectWithValue }) => {
    try {
      return await opportunitiesApi.getStages();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Erreur lors du chargement des étapes');
    }
  }
);

export const createOpportunity = createAsyncThunk(
  'opportunities/create',
  async (data: CreateOpportunityRequest, { rejectWithValue }) => {
    try {
      return await opportunitiesApi.create(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Erreur lors de la création');
    }
  }
);

export const updateOpportunity = createAsyncThunk(
  'opportunities/update',
  async ({ id, data }: { id: string; data: UpdateOpportunityRequest }, { rejectWithValue }) => {
    try {
      return await opportunitiesApi.update(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Erreur lors de la mise à jour');
    }
  }
);

export const deleteOpportunity = createAsyncThunk(
  'opportunities/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await opportunitiesApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Erreur lors de la suppression');
    }
  }
);

const opportunitiesSlice = createSlice({
  name: 'opportunities',
  initialState,
  reducers: {
    setQueryParams: (state, action: PayloadAction<Partial<OpportunitiesQueryParams>>) => {
      state.queryParams = { ...state.queryParams, ...action.payload };
    },
    clearCurrentOpportunity: (state) => {
      state.currentOpportunity = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchOpportunities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOpportunities.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.content;
        state.meta = {
          page: action.payload.page,
          size: action.payload.size,
          totalElements: action.payload.totalElements,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchOpportunities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch by ID
      .addCase(fetchOpportunityById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOpportunityById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOpportunity = action.payload;
      })
      .addCase(fetchOpportunityById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch stages
      .addCase(fetchOpportunityStages.pending, (state) => {
        state.stagesLoading = true;
      })
      .addCase(fetchOpportunityStages.fulfilled, (state, action) => {
        state.stagesLoading = false;
        state.stages = action.payload;
      })
      .addCase(fetchOpportunityStages.rejected, (state, action) => {
        state.stagesLoading = false;
        state.error = action.payload as string;
      })
      // Create
      .addCase(createOpportunity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOpportunity.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createOpportunity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update
      .addCase(updateOpportunity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOpportunity.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          // Update the list item with available fields
          state.items[index] = {
            ...state.items[index],
            name: action.payload.name,
            amount: action.payload.amount,
            currency: action.payload.currency,
            probability: action.payload.probability,
            stageId: action.payload.stage.id,
            stageName: action.payload.stage.name,
            stageColor: action.payload.stage.color,
            isClosed: action.payload.isClosed,
            isWon: action.payload.isWon,
            closeDate: action.payload.closeDate,
          };
        }
        if (state.currentOpportunity?.id === action.payload.id) {
          state.currentOpportunity = action.payload;
        }
      })
      .addCase(updateOpportunity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete
      .addCase(deleteOpportunity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteOpportunity.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((item) => item.id !== action.payload);
        if (state.meta) {
          state.meta.totalElements -= 1;
        }
      })
      .addCase(deleteOpportunity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setQueryParams, clearCurrentOpportunity, clearError } = opportunitiesSlice.actions;
export default opportunitiesSlice.reducer;
