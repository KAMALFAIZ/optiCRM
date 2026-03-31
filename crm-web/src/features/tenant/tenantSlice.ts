import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { tenantApi } from '@/api/tenant';
import type { TenantState } from '@/types/tenant';

const initialState: TenantState = {
  tenant: null,
  plans: [],
  isLoading: false,
  error: null,
};

export const fetchCurrentTenant = createAsyncThunk(
  'tenant/fetchCurrent',
  async (_, { rejectWithValue }) => {
    try {
      const res = await tenantApi.getCurrentTenant();
      return res.data.data!;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message || 'Erreur tenant');
    }
  }
);

export const fetchPlans = createAsyncThunk(
  'tenant/fetchPlans',
  async (_, { rejectWithValue }) => {
    try {
      const res = await tenantApi.getSubscriptionPlans();
      return res.data.data ?? [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message || 'Erreur plans');
    }
  }
);

const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    clearTenant(state) {
      state.tenant = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentTenant.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCurrentTenant.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tenant = action.payload;
      })
      .addCase(fetchCurrentTenant.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchPlans.fulfilled, (state, action) => {
        state.plans = action.payload;
      });
  },
});

export const { clearTenant } = tenantSlice.actions;
export default tenantSlice.reducer;
