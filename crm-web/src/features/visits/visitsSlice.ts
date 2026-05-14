import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Visit, VisitListItem, CreateVisitRequest, UpdateVisitRequest } from '../../types/visit';
import visitsApi, { VisitsQueryParams } from '../../api/visits';
import { PageMeta } from '../../types/api';

interface VisitsState {
  items: VisitListItem[];
  selectedVisit: Visit | null;
  loading: boolean;
  error: string | null;
  pagination: PageMeta;
  filters: VisitsQueryParams;
}

const initialState: VisitsState = {
  items: [],
  selectedVisit: null,
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
    sortBy: 'visitDate',
    sortDirection: 'desc',
  },
};

export const fetchVisits = createAsyncThunk(
  'visits/fetchAll',
  async (params: VisitsQueryParams, { rejectWithValue }) => {
    try {
      return await visitsApi.getAll(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors du chargement des visites');
    }
  }
);

export const fetchVisitById = createAsyncThunk(
  'visits/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await visitsApi.getById(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors du chargement');
    }
  }
);

export const createVisit = createAsyncThunk(
  'visits/create',
  async (data: CreateVisitRequest, { rejectWithValue }) => {
    try {
      return await visitsApi.create(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la création');
    }
  }
);

export const updateVisit = createAsyncThunk(
  'visits/update',
  async ({ id, data }: { id: string; data: UpdateVisitRequest }, { rejectWithValue }) => {
    try {
      return await visitsApi.update(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  }
);

export const deleteVisit = createAsyncThunk(
  'visits/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await visitsApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la suppression');
    }
  }
);

export const checkInVisit = createAsyncThunk(
  'visits/checkIn',
  async ({ id, latitude, longitude }: { id: string; latitude?: number; longitude?: number }, { rejectWithValue }) => {
    try {
      return await visitsApi.checkIn(id, latitude, longitude);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors du check-in');
    }
  }
);

export const checkOutVisit = createAsyncThunk(
  'visits/checkOut',
  async ({ id, notes, outcome }: { id: string; notes?: string; outcome?: string }, { rejectWithValue }) => {
    try {
      return await visitsApi.checkOut(id, notes, outcome);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors du check-out');
    }
  }
);

const visitsSlice = createSlice({
  name: 'visits',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<VisitsQueryParams>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearSelectedVisit: (state) => {
      state.selectedVisit = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVisits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVisits.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.content;
        state.pagination = {
          page: action.payload.page,
          size: action.payload.size,
          totalElements: action.payload.totalElements,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchVisits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchVisitById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedVisit = action.payload;
      })
      .addCase(createVisit.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateVisit.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedVisit = action.payload;
      })
      .addCase(deleteVisit.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(checkInVisit.fulfilled, (state, action) => {
        state.selectedVisit = action.payload;
      })
      .addCase(checkOutVisit.fulfilled, (state, action) => {
        state.selectedVisit = action.payload;
      });
  },
});

export const { setFilters, clearFilters, clearSelectedVisit, clearError } = visitsSlice.actions;
export default visitsSlice.reducer;
