import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  UserListItem,
  UserStats,
  CreateUserRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
  RoleOption,
  TeamOption,
  TerritoryOption,
} from '../../types/user';
import usersApi, { UsersQueryParams } from '../../api/users';
import { PageMeta } from '../../types/api';

interface UsersState {
  items: UserListItem[];
  loading: boolean;
  error: string | null;
  pagination: PageMeta;
  filters: UsersQueryParams;
  roles: RoleOption[];
  teams: TeamOption[];
  territories: TerritoryOption[];
  refDataLoaded: boolean;
  stats: UserStats | null;
  statsLoading: boolean;
}

const initialState: UsersState = {
  items: [],
  loading: false,
  error: null,
  pagination: {
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  },
  filters: {
    page: 1,
    size: 20,
    sortBy: 'createdAt',
    sortDirection: 'desc',
  },
  roles: [],
  teams: [],
  territories: [],
  refDataLoaded: false,
  stats: null,
  statsLoading: false,
};

export const fetchUsers = createAsyncThunk(
  'users/fetchAll',
  async (params: UsersQueryParams, { rejectWithValue }) => {
    try {
      return await usersApi.getAll(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Erreur lors du chargement des utilisateurs');
    }
  }
);

export const fetchUserStats = createAsyncThunk(
  'users/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      return await usersApi.getStats();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Erreur lors du chargement des statistiques');
    }
  }
);

export const createUser = createAsyncThunk(
  'users/create',
  async (data: CreateUserRequest, { rejectWithValue }) => {
    try {
      return await usersApi.create(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Erreur lors de la création');
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/update',
  async ({ id, data }: { id: string; data: UpdateUserRequest }, { rejectWithValue }) => {
    try {
      return await usersApi.update(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Erreur lors de la mise à jour');
    }
  }
);

export const activateUser = createAsyncThunk(
  'users/activate',
  async (id: string, { rejectWithValue }) => {
    try {
      await usersApi.activate(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || "Erreur lors de l'activation");
    }
  }
);

export const deactivateUser = createAsyncThunk(
  'users/deactivate',
  async (id: string, { rejectWithValue }) => {
    try {
      await usersApi.deactivate(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Erreur lors de la désactivation');
    }
  }
);

export const changeUserPassword = createAsyncThunk(
  'users/changePassword',
  async ({ id, data }: { id: string; data: ChangePasswordRequest }, { rejectWithValue }) => {
    try {
      await usersApi.changePassword(id, data);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Erreur lors du changement de mot de passe');
    }
  }
);

export const unlockUser = createAsyncThunk(
  'users/unlock',
  async (id: string, { rejectWithValue }) => {
    try {
      await usersApi.unlock(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Erreur lors du déverrouillage');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await usersApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Erreur lors de la suppression');
    }
  }
);

export const batchActivateUsers = createAsyncThunk(
  'users/batchActivate',
  async (ids: string[], { rejectWithValue }) => {
    try {
      return await usersApi.batchActivate(ids);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || "Erreur lors de l'activation en masse");
    }
  }
);

export const batchDeactivateUsers = createAsyncThunk(
  'users/batchDeactivate',
  async (ids: string[], { rejectWithValue }) => {
    try {
      return await usersApi.batchDeactivate(ids);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Erreur lors de la désactivation en masse');
    }
  }
);

export const fetchRefData = createAsyncThunk(
  'users/fetchRefData',
  async (_, { rejectWithValue }) => {
    try {
      const [roles, teams, territories] = await Promise.all([
        usersApi.getRoles(),
        usersApi.getTeams(),
        usersApi.getTerritories(),
      ]);
      return { roles, teams, territories };
    } catch (error: any) {
      return rejectWithValue('Erreur lors du chargement des données de référence');
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<UsersQueryParams>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.content;
        state.pagination = {
          page: action.payload.page,
          size: action.payload.size,
          totalElements: action.payload.totalElements,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Stats
      .addCase(fetchUserStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchUserStats.rejected, (state) => {
        state.statsLoading = false;
      })
      // Create
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Activate
      .addCase(activateUser.fulfilled, (state, action) => {
        const user = state.items.find((u) => u.id === action.payload);
        if (user) user.isActive = true;
      })
      // Deactivate
      .addCase(deactivateUser.fulfilled, (state, action) => {
        const user = state.items.find((u) => u.id === action.payload);
        if (user) user.isActive = false;
      })
      // Change password
      .addCase(changeUserPassword.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Unlock
      .addCase(unlockUser.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Batch activate
      .addCase(batchActivateUsers.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Delete
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.items = state.items.filter((u) => u.id !== action.payload);
        state.pagination.totalElements = Math.max(0, state.pagination.totalElements - 1);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Batch deactivate
      .addCase(batchDeactivateUsers.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Ref data
      .addCase(fetchRefData.fulfilled, (state, action) => {
        state.roles = action.payload.roles;
        state.teams = action.payload.teams;
        state.territories = action.payload.territories;
        state.refDataLoaded = true;
      });
  },
});

export const { setFilters, clearFilters, clearError } = usersSlice.actions;
export default usersSlice.reducer;
