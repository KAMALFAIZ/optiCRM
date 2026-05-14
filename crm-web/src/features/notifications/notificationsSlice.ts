import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import notificationsApi from '@/api/notifications';
import type { Notification, NotificationsState } from '@/types/notification';

export const fetchNotifications = createAsyncThunk('notifications/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await notificationsApi.getAll(1, 20);
  } catch (e: any) {
    return rejectWithValue(e.message);
  }
});

export const fetchUnreadCount = createAsyncThunk('notifications/unreadCount', async (_, { rejectWithValue }) => {
  try {
    return await notificationsApi.getUnreadCount();
  } catch {
    return rejectWithValue(0);
  }
});

export const markAsRead = createAsyncThunk('notifications/markAsRead', async (id: string, { rejectWithValue }) => {
  try {
    return await notificationsApi.markAsRead(id);
  } catch (e: any) {
    return rejectWithValue(e.message);
  }
});

export const markAllAsRead = createAsyncThunk('notifications/markAllAsRead', async (_, { rejectWithValue }) => {
  try {
    await notificationsApi.markAllAsRead();
  } catch (e: any) {
    return rejectWithValue(e.message);
  }
});

export const deleteNotification = createAsyncThunk('notifications/delete', async (id: string, { rejectWithValue }) => {
  try {
    await notificationsApi.delete(id);
    return id;
  } catch (e: any) {
    return rejectWithValue(e.message);
  }
});

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
  loading: false,
  total: 0,
  page: 1,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => { state.loading = true; })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.content;
        state.total = action.payload.totalElements;
        state.unreadCount = action.payload.content.filter((n) => !n.isRead).length;
      })
      .addCase(fetchNotifications.rejected, (state) => { state.loading = false; })

      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload as number;
      })

      .addCase(markAsRead.fulfilled, (state, action) => {
        const updated = action.payload as Notification;
        const idx = state.items.findIndex((n) => n.id === updated.id);
        if (idx !== -1) {
          state.items[idx] = updated;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })

      .addCase(markAllAsRead.fulfilled, (state) => {
        state.items = state.items.map((n) => ({ ...n, isRead: true }));
        state.unreadCount = 0;
      })

      .addCase(deleteNotification.fulfilled, (state, action) => {
        const id = action.payload as string;
        const n = state.items.find((x) => x.id === id);
        if (n && !n.isRead) state.unreadCount = Math.max(0, state.unreadCount - 1);
        state.items = state.items.filter((x) => x.id !== id);
      });
  },
});

export default notificationsSlice.reducer;
