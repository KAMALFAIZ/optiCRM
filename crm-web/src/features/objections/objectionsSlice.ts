import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import objectionsApi, { ObjectionFilters } from '@/api/objections';
import {
  Objection,
  ObjectionListItem,
  CreateObjectionRequest,
  UpdateObjectionRequest,
  ResolveObjectionRequest,
  ObjectionStats,
  ObjectionCategory,
  ObjectionStatus,
  ObjectionPriority,
} from '@/types/objection';

interface ObjectionsState {
  objections: ObjectionListItem[];
  selectedObjection: Objection | null;
  stats: ObjectionStats | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  filters: {
    status?: ObjectionStatus;
    category?: ObjectionCategory;
    priority?: ObjectionPriority;
    assignedToId?: string;
    accountId?: string;
    search?: string;
    page: number;
    size: number;
    sortBy: string;
    sortDir: 'asc' | 'desc';
  };
}

const initialState: ObjectionsState = {
  objections: [],
  selectedObjection: null,
  stats: null,
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

export const fetchObjections = createAsyncThunk(
  'objections/fetchObjections',
  async (filters: ObjectionFilters) => {
    const response = await objectionsApi.getAll(filters);
    return response.data;
  }
);

export const fetchObjectionById = createAsyncThunk(
  'objections/fetchObjectionById',
  async (id: string) => {
    const response = await objectionsApi.getById(id);
    return response.data;
  }
);

export const fetchObjectionStats = createAsyncThunk(
  'objections/fetchObjectionStats',
  async () => {
    const response = await objectionsApi.getStats();
    return response.data;
  }
);

export const createObjection = createAsyncThunk(
  'objections/createObjection',
  async (data: CreateObjectionRequest, { rejectWithValue }) => {
    try {
      const response = await objectionsApi.create(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la création');
    }
  }
);

export const updateObjection = createAsyncThunk(
  'objections/updateObjection',
  async ({ id, data }: { id: string; data: UpdateObjectionRequest }, { rejectWithValue }) => {
    try {
      const response = await objectionsApi.update(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  }
);

export const resolveObjection = createAsyncThunk(
  'objections/resolveObjection',
  async ({ id, data }: { id: string; data: ResolveObjectionRequest }, { rejectWithValue }) => {
    try {
      const response = await objectionsApi.resolve(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la résolution');
    }
  }
);

export const deleteObjection = createAsyncThunk(
  'objections/deleteObjection',
  async (id: string, { rejectWithValue }) => {
    try {
      await objectionsApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la suppression');
    }
  }
);

const objectionsSlice = createSlice({
  name: 'objections',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<ObjectionsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearSelectedObjection: (state) => {
      state.selectedObjection = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch objections
      .addCase(fetchObjections.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchObjections.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.objections = action.payload.content;
          state.pagination = {
            page: action.payload.page,
            size: action.payload.size,
            totalElements: action.payload.totalElements,
            totalPages: action.payload.totalPages,
          };
        }
      })
      .addCase(fetchObjections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erreur lors du chargement des objections';
      })
      // Fetch objection by ID
      .addCase(fetchObjectionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchObjectionById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedObjection = action.payload ?? null;
      })
      .addCase(fetchObjectionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Erreur lors du chargement de l'objection";
      })
      // Fetch stats
      .addCase(fetchObjectionStats.fulfilled, (state, action) => {
        state.stats = action.payload ?? null;
      })
      // Create objection
      .addCase(createObjection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createObjection.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createObjection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update objection
      .addCase(updateObjection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateObjection.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedObjection = action.payload ?? null;
      })
      .addCase(updateObjection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Resolve objection
      .addCase(resolveObjection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resolveObjection.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedObjection = action.payload ?? null;
      })
      .addCase(resolveObjection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete objection
      .addCase(deleteObjection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteObjection.fulfilled, (state, action) => {
        state.loading = false;
        state.objections = state.objections.filter((o) => o.id !== action.payload);
      })
      .addCase(deleteObjection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setFilters, clearFilters, clearSelectedObjection, clearError } =
  objectionsSlice.actions;
export default objectionsSlice.reducer;
