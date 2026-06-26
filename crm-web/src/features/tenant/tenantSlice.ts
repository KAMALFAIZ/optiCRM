import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { tenantApi } from '@/api/tenant';
import type { TenantState, TenantPublicInfo } from '@/types/tenant';

const TENANT_SLUG_KEY = 'opticrm_tenant_slug';
const TENANT_ID_KEY = 'opticrm_tenant_id';

const initialState: TenantState = {
  tenant: null,
  publicInfo: null,
  plans: [],
  isLoading: false,
  error: null,
};

/**
 * Resolves a tenant slug (extracted from the subdomain, e.g. acme.kasoft.ma) into public tenant info.
 * This runs BEFORE auth — uses a raw axios call (no X-Tenant-ID header needed).
 */
export const resolveSlug = createAsyncThunk(
  'tenant/resolveSlug',
  async (slug: string, { rejectWithValue }) => {
    try {
      const res = await tenantApi.resolveSlug(slug);
      localStorage.setItem(TENANT_SLUG_KEY, res.data.slug);
      localStorage.setItem(TENANT_ID_KEY, res.data.id);
      return res.data;
    } catch {
      localStorage.removeItem(TENANT_SLUG_KEY);
      localStorage.removeItem(TENANT_ID_KEY);
      return rejectWithValue('Tenant introuvable');
    }
  }
);

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
      state.publicInfo = null;
      state.error = null;
      localStorage.removeItem(TENANT_SLUG_KEY);
      localStorage.removeItem(TENANT_ID_KEY);
    },
    setPublicInfo(state, action: PayloadAction<TenantPublicInfo>) {
      state.publicInfo = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(resolveSlug.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resolveSlug.fulfilled, (state, action) => {
        state.isLoading = false;
        state.publicInfo = action.payload;
      })
      .addCase(resolveSlug.rejected, (state, action) => {
        state.isLoading = false;
        state.publicInfo = null;
        state.error = action.payload as string;
      })
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

export const { clearTenant, setPublicInfo } = tenantSlice.actions;

export const selectTenantId = (state: { tenant: TenantState }): string | null =>
  state.tenant.publicInfo?.id ?? state.tenant.tenant?.id ?? localStorage.getItem(TENANT_ID_KEY);

export const selectTenantSlug = (): string | null =>
  localStorage.getItem(TENANT_SLUG_KEY);

export default tenantSlice.reducer;
