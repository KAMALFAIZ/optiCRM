import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Account, AccountListItem, CreateAccountRequest, UpdateAccountRequest, Industry } from '../../types/account';
import accountsApi, { AccountsQueryParams, AccountStats, industriesApi } from '../../api/accounts';
import { PageMeta } from '../../types/api';

interface AccountsState {
  items: AccountListItem[];
  selectedAccount: Account | null;
  accountStats: AccountStats | null;
  industries: Industry[];
  loading: boolean;
  error: string | null;
  pagination: PageMeta;
  filters: AccountsQueryParams;
}

const initialState: AccountsState = {
  items: [],
  selectedAccount: null,
  accountStats: null,
  industries: [],
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
    sortDirection: 'desc',
  },
};

export const fetchAccounts = createAsyncThunk(
  'accounts/fetchAll',
  async (params: AccountsQueryParams, { rejectWithValue }) => {
    try {
      return await accountsApi.getAll(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors du chargement des comptes');
    }
  }
);

export const fetchAccountById = createAsyncThunk(
  'accounts/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await accountsApi.getById(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors du chargement du compte');
    }
  }
);

export const fetchAccountStats = createAsyncThunk(
  'accounts/fetchStats',
  async (id: string, { rejectWithValue }) => {
    try {
      return await accountsApi.getStats(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors du chargement des statistiques');
    }
  }
);

export const createAccount = createAsyncThunk(
  'accounts/create',
  async (data: CreateAccountRequest, { rejectWithValue }) => {
    try {
      return await accountsApi.create(data);
    } catch (error: any) {
      if (error?.isOfflineQueued) {
        return rejectWithValue('OFFLINE_QUEUED');
      }
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la création du compte');
    }
  }
);

export const updateAccount = createAsyncThunk(
  'accounts/update',
  async ({ id, data }: { id: string; data: UpdateAccountRequest }, { rejectWithValue }) => {
    try {
      return await accountsApi.update(id, data);
    } catch (error: any) {
      if (error?.isOfflineQueued) return rejectWithValue('OFFLINE_QUEUED');
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la mise à jour du compte');
    }
  }
);

export const deleteAccount = createAsyncThunk(
  'accounts/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await accountsApi.delete(id);
      return id;
    } catch (error: any) {
      if (error?.isOfflineQueued) return rejectWithValue('OFFLINE_QUEUED');
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la suppression du compte');
    }
  }
);

export const fetchIndustries = createAsyncThunk(
  'accounts/fetchIndustries',
  async (_, { rejectWithValue }) => {
    try {
      return await industriesApi.getAll();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors du chargement des secteurs');
    }
  }
);

const accountsSlice = createSlice({
  name: 'accounts',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<AccountsQueryParams>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearSelectedAccount: (state) => {
      state.selectedAccount = null;
      state.accountStats = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    patchSelectedAccount: (state, action: PayloadAction<Partial<Account>>) => {
      if (state.selectedAccount) {
        state.selectedAccount = { ...state.selectedAccount, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchAccounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.content;
        state.pagination = {
          page: action.payload.page,
          size: action.payload.size,
          totalElements: action.payload.totalElements,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch by ID
      .addCase(fetchAccountById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccountById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedAccount = action.payload;
      })
      .addCase(fetchAccountById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch stats
      .addCase(fetchAccountStats.fulfilled, (state, action) => {
        state.accountStats = action.payload;
      })
      // Create
      .addCase(createAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAccount.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update
      .addCase(updateAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedAccount = action.payload;
      })
      .addCase(updateAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete
      .addCase(deleteAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch industries
      .addCase(fetchIndustries.fulfilled, (state, action) => {
        state.industries = action.payload;
      });
  },
});

export const { setFilters, clearFilters, clearSelectedAccount, clearError, patchSelectedAccount } = accountsSlice.actions;
export default accountsSlice.reducer;
