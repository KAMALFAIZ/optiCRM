import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import salesOrdersApi, { SalesOrderFilters } from '@/api/salesOrders';
import {
  SalesOrder,
  SalesOrderListItem,
  CreateSalesOrderRequest,
  UpdateSalesOrderRequest,
  OrderStatus,
} from '@/types/salesOrder';

interface SalesOrdersState {
  orders: SalesOrderListItem[];
  selectedOrder: SalesOrder | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  filters: {
    accountId?: string;
    status?: OrderStatus;
    startDate?: string;
    endDate?: string;
    search?: string;
    page: number;
    size: number;
    sortBy: string;
    sortDir: 'asc' | 'desc';
  };
}

const initialState: SalesOrdersState = {
  orders: [],
  selectedOrder: null,
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
    sortBy: 'orderDate',
    sortDir: 'desc',
  },
};

export const fetchSalesOrders = createAsyncThunk(
  'salesOrders/fetchSalesOrders',
  async (filters: SalesOrderFilters) => {
    const response = await salesOrdersApi.getAll(filters);
    return response.data;
  }
);

export const fetchSalesOrderById = createAsyncThunk(
  'salesOrders/fetchSalesOrderById',
  async (id: string) => {
    const response = await salesOrdersApi.getById(id);
    return response.data;
  }
);

export const createSalesOrder = createAsyncThunk(
  'salesOrders/createSalesOrder',
  async (data: CreateSalesOrderRequest, { rejectWithValue }) => {
    try {
      const response = await salesOrdersApi.create(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la création');
    }
  }
);

export const updateSalesOrder = createAsyncThunk(
  'salesOrders/updateSalesOrder',
  async ({ id, data }: { id: string; data: UpdateSalesOrderRequest }, { rejectWithValue }) => {
    try {
      const response = await salesOrdersApi.update(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  }
);

export const deleteSalesOrder = createAsyncThunk(
  'salesOrders/deleteSalesOrder',
  async (id: string, { rejectWithValue }) => {
    try {
      await salesOrdersApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la suppression');
    }
  }
);

export const confirmSalesOrder = createAsyncThunk(
  'salesOrders/confirmSalesOrder',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await salesOrdersApi.confirm(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la confirmation');
    }
  }
);

export const shipSalesOrder = createAsyncThunk(
  'salesOrders/shipSalesOrder',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await salesOrdersApi.ship(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || "Erreur lors de l'expédition");
    }
  }
);

export const deliverSalesOrder = createAsyncThunk(
  'salesOrders/deliverSalesOrder',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await salesOrdersApi.deliver(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la livraison');
    }
  }
);

export const cancelSalesOrder = createAsyncThunk(
  'salesOrders/cancelSalesOrder',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await salesOrdersApi.cancel(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || "Erreur lors de l'annulation");
    }
  }
);

const salesOrdersSlice = createSlice({
  name: 'salesOrders',
  initialState,
  reducers: {
    setOrderFilters: (state, action: PayloadAction<Partial<SalesOrdersState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearOrderFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearSelectedOrder: (state) => {
      state.selectedOrder = null;
    },
    clearOrderError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalesOrders.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.orders = action.payload.content;
          state.pagination = {
            page: action.payload.page,
            size: action.payload.size,
            totalElements: action.payload.totalElements,
            totalPages: action.payload.totalPages,
          };
        }
      })
      .addCase(fetchSalesOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erreur lors du chargement des commandes';
      })
      .addCase(fetchSalesOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalesOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedOrder = action.payload ?? null;
      })
      .addCase(fetchSalesOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erreur lors du chargement de la commande';
      })
      .addCase(createSalesOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSalesOrder.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createSalesOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateSalesOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedOrder = action.payload ?? null;
      })
      .addCase(deleteSalesOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = state.orders.filter((o) => o.id !== action.payload);
      })
      .addCase(confirmSalesOrder.fulfilled, (state) => { state.loading = false; })
      .addCase(shipSalesOrder.fulfilled, (state) => { state.loading = false; })
      .addCase(deliverSalesOrder.fulfilled, (state) => { state.loading = false; })
      .addCase(cancelSalesOrder.fulfilled, (state) => { state.loading = false; });
  },
});

export const { setOrderFilters, clearOrderFilters, clearSelectedOrder, clearOrderError } =
  salesOrdersSlice.actions;
export default salesOrdersSlice.reducer;
