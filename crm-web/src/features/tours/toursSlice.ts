import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Tour, TourListItem, CreateTourRequest, UpdateTourRequest } from '../../types/tour';
import toursApi, { ToursQueryParams } from '../../api/tours';
import { PageMeta } from '../../types/api';

interface ToursState {
  items: TourListItem[];
  selectedTour: Tour | null;
  loading: boolean;
  error: string | null;
  pagination: PageMeta;
  filters: ToursQueryParams;
}

const initialState: ToursState = {
  items: [],
  selectedTour: null,
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
    sortBy: 'tourDate',
    sortDirection: 'desc',
  },
};

export const fetchTours = createAsyncThunk(
  'tours/fetchAll',
  async (params: ToursQueryParams, { rejectWithValue }) => {
    try {
      return await toursApi.getAll(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors du chargement des tournées');
    }
  }
);

export const fetchTourById = createAsyncThunk(
  'tours/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await toursApi.getById(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors du chargement');
    }
  }
);

export const createTour = createAsyncThunk(
  'tours/create',
  async (data: CreateTourRequest, { rejectWithValue }) => {
    try {
      return await toursApi.create(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la création');
    }
  }
);

export const updateTour = createAsyncThunk(
  'tours/update',
  async ({ id, data }: { id: string; data: UpdateTourRequest }, { rejectWithValue }) => {
    try {
      return await toursApi.update(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  }
);

export const deleteTour = createAsyncThunk(
  'tours/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await toursApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la suppression');
    }
  }
);

export const startTour = createAsyncThunk(
  'tours/start',
  async (id: string, { rejectWithValue }) => {
    try {
      return await toursApi.start(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur');
    }
  }
);

export const completeTour = createAsyncThunk(
  'tours/complete',
  async (id: string, { rejectWithValue }) => {
    try {
      return await toursApi.complete(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur');
    }
  }
);

export const reorderTourVisits = createAsyncThunk(
  'tours/reorderVisits',
  async ({ tourId, visitIds }: { tourId: string; visitIds: string[] }, { rejectWithValue }) => {
    try {
      return await toursApi.reorderVisits(tourId, visitIds);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors du réordonnement');
    }
  }
);

const toursSlice = createSlice({
  name: 'tours',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<ToursQueryParams>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearSelectedTour: (state) => {
      state.selectedTour = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTours.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTours.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.content;
        state.pagination = {
          page: action.payload.page,
          size: action.payload.size,
          totalElements: action.payload.totalElements,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchTours.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchTourById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedTour = action.payload;
      })
      .addCase(createTour.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateTour.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedTour = action.payload;
      })
      .addCase(deleteTour.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(startTour.fulfilled, (state, action) => {
        state.selectedTour = action.payload;
      })
      .addCase(completeTour.fulfilled, (state, action) => {
        state.selectedTour = action.payload;
      })
      .addCase(reorderTourVisits.fulfilled, (state, action) => {
        state.selectedTour = action.payload;
      });
  },
});

export const { setFilters, clearFilters, clearSelectedTour, clearError } = toursSlice.actions;
export default toursSlice.reducer;
