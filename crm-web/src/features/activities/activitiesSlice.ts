import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Activity, ActivityListItem, CreateActivityRequest, UpdateActivityRequest } from '../../types/activity';
import activitiesApi, { ActivitiesQueryParams } from '../../api/activities';
import { PageMeta } from '../../types/api';

interface ActivitiesState {
  items: ActivityListItem[];
  calendarEvents: ActivityListItem[];
  selectedActivity: Activity | null;
  loading: boolean;
  error: string | null;
  pagination: PageMeta;
  filters: ActivitiesQueryParams;
}

const initialState: ActivitiesState = {
  items: [],
  calendarEvents: [],
  selectedActivity: null,
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
    sortBy: 'startDate',
    sortDirection: 'desc',
  },
};

export const fetchActivities = createAsyncThunk(
  'activities/fetchAll',
  async (params: ActivitiesQueryParams, { rejectWithValue }) => {
    try {
      return await activitiesApi.getAll(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors du chargement des activités');
    }
  }
);

export const fetchCalendarEvents = createAsyncThunk(
  'activities/fetchCalendar',
  async ({ from, to, assignedToId }: { from: string; to: string; assignedToId?: string }, { rejectWithValue }) => {
    try {
      return await activitiesApi.getCalendarEvents(from, to, assignedToId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors du chargement du calendrier');
    }
  }
);

export const fetchActivityById = createAsyncThunk(
  'activities/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await activitiesApi.getById(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors du chargement');
    }
  }
);

export const createActivity = createAsyncThunk(
  'activities/create',
  async (data: CreateActivityRequest, { rejectWithValue }) => {
    try {
      return await activitiesApi.create(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la création');
    }
  }
);

export const updateActivity = createAsyncThunk(
  'activities/update',
  async ({ id, data }: { id: string; data: UpdateActivityRequest }, { rejectWithValue }) => {
    try {
      return await activitiesApi.update(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  }
);

export const deleteActivity = createAsyncThunk(
  'activities/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await activitiesApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la suppression');
    }
  }
);

export const completeActivity = createAsyncThunk(
  'activities/complete',
  async (id: string, { rejectWithValue }) => {
    try {
      return await activitiesApi.complete(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur');
    }
  }
);

export const rescheduleActivity = createAsyncThunk(
  'activities/reschedule',
  async ({ id, startDate, endDate }: { id: string; startDate: string; endDate?: string }, { rejectWithValue }) => {
    try {
      return await activitiesApi.update(id, { startDate, endDate } as UpdateActivityRequest);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la replanification');
    }
  }
);

const activitiesSlice = createSlice({
  name: 'activities',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<ActivitiesQueryParams>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearSelectedActivity: (state) => {
      state.selectedActivity = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.content;
        state.pagination = {
          page: action.payload.page,
          size: action.payload.size,
          totalElements: action.payload.totalElements,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCalendarEvents.fulfilled, (state, action) => {
        state.calendarEvents = action.payload;
      })
      .addCase(fetchActivityById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivityById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedActivity = action.payload;
      })
      .addCase(fetchActivityById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createActivity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createActivity.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createActivity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateActivity.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedActivity = action.payload;
      })
      .addCase(deleteActivity.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(completeActivity.fulfilled, (state, action) => {
        state.selectedActivity = action.payload;
        const idx = state.items.findIndex((i) => i.id === action.payload.id);
        if (idx !== -1) {
          state.items[idx] = { ...state.items[idx], status: 'completed' };
        }
      })
      .addCase(rescheduleActivity.fulfilled, (state, action) => {
        state.selectedActivity = action.payload;
      });
  },
});

export const { setFilters, clearFilters, clearSelectedActivity, clearError } = activitiesSlice.actions;
export default activitiesSlice.reducer;
