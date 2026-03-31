import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { StockLevel, StockMovement, CreateStockMovementRequest } from '../../types/stock';
import { Warehouse } from '../../types/warehouse';
import stockLevelsApi, { StockLevelsQueryParams } from '../../api/stockLevels';
import stockMovementsApi, { StockMovementsQueryParams } from '../../api/stockMovements';
import warehousesApi from '../../api/warehouses';
import { PageMeta } from '../../types/api';

interface InventoryState {
  stockLevels: StockLevel[];
  movements: StockMovement[];
  warehouses: Warehouse[];
  lowStockItems: StockLevel[];
  selectedStockLevel: StockLevel | null;
  loading: boolean;
  error: string | null;
  pagination: PageMeta;
  filters: StockLevelsQueryParams;
  movementsPagination: PageMeta;
  movementsFilters: StockMovementsQueryParams;
}

const initialState: InventoryState = {
  stockLevels: [],
  movements: [],
  warehouses: [],
  lowStockItems: [],
  selectedStockLevel: null,
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
  },
  movementsPagination: {
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  },
  movementsFilters: {
    page: 0,
    size: 20,
    sortBy: 'createdAt',
    sortDirection: 'desc',
  },
};

export const fetchStockLevels = createAsyncThunk(
  'inventory/fetchStockLevels',
  async (params: StockLevelsQueryParams, { rejectWithValue }) => {
    try {
      return await stockLevelsApi.getAll(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors du chargement des stocks');
    }
  }
);

export const fetchWarehouses = createAsyncThunk(
  'inventory/fetchWarehouses',
  async (_, { rejectWithValue }) => {
    try {
      return await warehousesApi.getActive();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors du chargement des entrepôts');
    }
  }
);

export const fetchLowStock = createAsyncThunk(
  'inventory/fetchLowStock',
  async (_, { rejectWithValue }) => {
    try {
      return await stockLevelsApi.getLowStock();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors du chargement des alertes stock');
    }
  }
);

export const fetchMovements = createAsyncThunk(
  'inventory/fetchMovements',
  async (params: StockMovementsQueryParams, { rejectWithValue }) => {
    try {
      return await stockMovementsApi.getAll(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors du chargement des mouvements');
    }
  }
);

export const createAdjustment = createAsyncThunk(
  'inventory/createAdjustment',
  async (
    { productId, warehouseId, newQuantity, notes }: { productId: string; warehouseId: string; newQuantity: number; notes?: string },
    { rejectWithValue }
  ) => {
    try {
      return await stockMovementsApi.createAdjustment(productId, warehouseId, newQuantity, notes);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de l\'ajustement');
    }
  }
);

export const createStockEntry = createAsyncThunk(
  'inventory/createStockEntry',
  async (data: CreateStockMovementRequest, { rejectWithValue }) => {
    try {
      return await stockMovementsApi.create(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || "Erreur lors de l'entrée de stock");
    }
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<StockLevelsQueryParams>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setMovementsFilters: (state, action: PayloadAction<Partial<StockMovementsQueryParams>>) => {
      state.movementsFilters = { ...state.movementsFilters, ...action.payload };
    },
    clearMovementsFilters: (state) => {
      state.movementsFilters = initialState.movementsFilters;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch stock levels
      .addCase(fetchStockLevels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStockLevels.fulfilled, (state, action) => {
        state.loading = false;
        state.stockLevels = action.payload.content;
        state.pagination = {
          page: action.payload.page,
          size: action.payload.size,
          totalElements: action.payload.totalElements,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchStockLevels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch warehouses
      .addCase(fetchWarehouses.fulfilled, (state, action) => {
        state.warehouses = action.payload;
      })
      // Fetch low stock
      .addCase(fetchLowStock.fulfilled, (state, action) => {
        state.lowStockItems = action.payload;
      })
      // Fetch movements
      .addCase(fetchMovements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMovements.fulfilled, (state, action) => {
        state.loading = false;
        state.movements = action.payload.content;
        state.movementsPagination = {
          page: action.payload.page,
          size: action.payload.size,
          totalElements: action.payload.totalElements,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchMovements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create adjustment
      .addCase(createAdjustment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAdjustment.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createAdjustment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create stock entry (PURCHASE)
      .addCase(createStockEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStockEntry.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createStockEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setFilters, clearFilters, setMovementsFilters, clearMovementsFilters, clearError } = inventorySlice.actions;
export default inventorySlice.reducer;
