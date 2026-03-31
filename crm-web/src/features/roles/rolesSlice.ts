import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RoleItem, CreateRoleRequest, UpdateRoleRequest, RolePermissions } from '../../types/role';
import rolesApi from '../../api/roles';

interface RolesState {
  items: RoleItem[];
  loading: boolean;
  error: string | null;
}

const initialState: RolesState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchRoles = createAsyncThunk(
  'roles/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await rolesApi.getAll();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Erreur lors du chargement des rôles');
    }
  }
);

export const createRole = createAsyncThunk(
  'roles/create',
  async (data: CreateRoleRequest, { rejectWithValue }) => {
    try {
      return await rolesApi.create(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Erreur lors de la création du rôle');
    }
  }
);

export const updateRole = createAsyncThunk(
  'roles/update',
  async ({ id, data }: { id: string; data: UpdateRoleRequest }, { rejectWithValue }) => {
    try {
      return await rolesApi.update(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Erreur lors de la mise à jour du rôle');
    }
  }
);

export const deleteRole = createAsyncThunk(
  'roles/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await rolesApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Erreur lors de la suppression du rôle');
    }
  }
);

export const updateRolePermissions = createAsyncThunk(
  'roles/updatePermissions',
  async ({ id, permissions }: { id: string; permissions: RolePermissions }, { rejectWithValue }) => {
    try {
      return await rolesApi.updatePermissions(id, permissions);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Erreur lors de la mise à jour des permissions');
    }
  }
);

export const duplicateRole = createAsyncThunk(
  'roles/duplicate',
  async ({ id, name }: { id: string; name: string }, { rejectWithValue }) => {
    try {
      return await rolesApi.duplicate(id, name);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Erreur lors de la duplication du rôle');
    }
  }
);

const rolesSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(createRole.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        const idx = state.items.findIndex((r) => r.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.items = state.items.filter((r) => r.id !== action.payload);
      })
      .addCase(deleteRole.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(updateRolePermissions.fulfilled, (state, action) => {
        const idx = state.items.findIndex((r) => r.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updateRolePermissions.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(duplicateRole.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(duplicateRole.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = rolesSlice.actions;
export default rolesSlice.reducer;
