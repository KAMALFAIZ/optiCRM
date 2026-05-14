import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import googleCalendarApi, { GoogleCalendarStatus, GoogleCalendarEvent } from '@/api/googleCalendar';

interface GoogleCalendarState {
  status: GoogleCalendarStatus | null;
  events: GoogleCalendarEvent[];
  loading: boolean;
  eventsLoading: boolean;
  error: string | null;
}

const initialState: GoogleCalendarState = {
  status: null,
  events: [],
  loading: false,
  eventsLoading: false,
  error: null,
};

export const fetchGoogleCalendarStatus = createAsyncThunk(
  'googleCalendar/fetchStatus',
  async (_, { rejectWithValue }) => {
    try {
      return await googleCalendarApi.getStatus();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la vérification du statut');
    }
  }
);

export const connectGoogleCalendar = createAsyncThunk(
  'googleCalendar/connect',
  async (_, { rejectWithValue }) => {
    try {
      const url = await googleCalendarApi.getAuthUrl();
      window.location.href = url;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la connexion Google');
    }
  }
);

export const disconnectGoogleCalendar = createAsyncThunk(
  'googleCalendar/disconnect',
  async (_, { rejectWithValue }) => {
    try {
      await googleCalendarApi.disconnect();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la déconnexion');
    }
  }
);

export const fetchGoogleCalendarEvents = createAsyncThunk(
  'googleCalendar/fetchEvents',
  async ({ from, to }: { from: string; to: string }, { rejectWithValue }) => {
    try {
      return await googleCalendarApi.getEvents(from, to);
    } catch {
      return rejectWithValue(null);
    }
  }
);

const googleCalendarSlice = createSlice({
  name: 'googleCalendar',
  initialState,
  reducers: {
    clearGoogleEvents: (state) => {
      state.events = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGoogleCalendarStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGoogleCalendarStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.status = action.payload;
      })
      .addCase(fetchGoogleCalendarStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(disconnectGoogleCalendar.pending, (state) => {
        state.loading = true;
      })
      .addCase(disconnectGoogleCalendar.fulfilled, (state) => {
        state.loading = false;
        state.status = { connected: false, googleEmail: null, calendarId: null, syncEnabled: false };
        state.events = [];
      })
      .addCase(disconnectGoogleCalendar.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchGoogleCalendarEvents.pending, (state) => {
        state.eventsLoading = true;
      })
      .addCase(fetchGoogleCalendarEvents.fulfilled, (state, action) => {
        state.eventsLoading = false;
        state.events = action.payload;
      })
      .addCase(fetchGoogleCalendarEvents.rejected, (state) => {
        state.eventsLoading = false;
        state.events = [];
      });
  },
});

export const { clearGoogleEvents } = googleCalendarSlice.actions;
export default googleCalendarSlice.reducer;
