import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  ExpenseReport,
  ExpenseReportListItem,
  CreateExpenseReportRequest,
  UpdateExpenseReportRequest,
} from '../../../types/expenseReport';
import expenseReportsApi, { ExpenseReportQueryParams } from '../../../api/expenseReports';
import { PageMeta } from '../../../types/api';

interface ExpenseReportsState {
  items: ExpenseReportListItem[];
  tourItems: ExpenseReportListItem[];
  selectedReport: ExpenseReport | null;
  loading: boolean;
  error: string | null;
  pagination: PageMeta;
  filters: ExpenseReportQueryParams;
}

const initialState: ExpenseReportsState = {
  items: [],
  tourItems: [],
  selectedReport: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  },
  filters: {
    page: 1,
    size: 20,
    sortBy: 'createdAt',
    sortDir: 'desc',
  },
};

export const fetchExpenseReports = createAsyncThunk(
  'expenseReports/fetchAll',
  async (params: ExpenseReportQueryParams, { rejectWithValue }) => {
    try {
      return await expenseReportsApi.getAll(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors du chargement des notes de frais');
    }
  }
);

export const fetchExpenseReportById = createAsyncThunk(
  'expenseReports/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await expenseReportsApi.getById(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors du chargement');
    }
  }
);

export const fetchExpenseReportsByTour = createAsyncThunk(
  'expenseReports/fetchByTour',
  async (tourId: string, { rejectWithValue }) => {
    try {
      return await expenseReportsApi.getByTour(tourId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors du chargement');
    }
  }
);

export const createExpenseReport = createAsyncThunk(
  'expenseReports/create',
  async (data: CreateExpenseReportRequest, { rejectWithValue }) => {
    try {
      return await expenseReportsApi.create(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la création');
    }
  }
);

export const updateExpenseReport = createAsyncThunk(
  'expenseReports/update',
  async ({ id, data }: { id: string; data: UpdateExpenseReportRequest }, { rejectWithValue }) => {
    try {
      return await expenseReportsApi.update(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  }
);

export const deleteExpenseReport = createAsyncThunk(
  'expenseReports/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await expenseReportsApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la suppression');
    }
  }
);

export const submitExpenseReport = createAsyncThunk(
  'expenseReports/submit',
  async (id: string, { rejectWithValue }) => {
    try {
      return await expenseReportsApi.submit(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur');
    }
  }
);

export const approveExpenseReport = createAsyncThunk(
  'expenseReports/approve',
  async (id: string, { rejectWithValue }) => {
    try {
      return await expenseReportsApi.approve(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur');
    }
  }
);

export const rejectExpenseReport = createAsyncThunk(
  'expenseReports/reject',
  async ({ id, reason }: { id: string; reason: string }, { rejectWithValue }) => {
    try {
      return await expenseReportsApi.reject(id, reason);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur');
    }
  }
);

export const reimburseExpenseReport = createAsyncThunk(
  'expenseReports/reimburse',
  async (id: string, { rejectWithValue }) => {
    try {
      return await expenseReportsApi.reimburse(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur');
    }
  }
);

const expenseReportSlice = createSlice({
  name: 'expenseReports',
  initialState,
  reducers: {
    setExpenseReportFilters: (state, action: PayloadAction<Partial<ExpenseReportQueryParams>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearExpenseReportFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearSelectedExpenseReport: (state) => {
      state.selectedReport = null;
    },
    clearExpenseReportError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenseReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenseReports.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.content;
        state.pagination = {
          page: action.payload.page,
          size: action.payload.size,
          totalElements: action.payload.totalElements,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchExpenseReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchExpenseReportById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenseReportById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedReport = action.payload;
      })
      .addCase(fetchExpenseReportById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchExpenseReportsByTour.fulfilled, (state, action) => {
        state.tourItems = action.payload;
      })
      .addCase(createExpenseReport.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateExpenseReport.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedReport = action.payload;
      })
      .addCase(deleteExpenseReport.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((item) => item.id !== action.payload);
        state.tourItems = state.tourItems.filter((item) => item.id !== action.payload);
      })
      .addCase(submitExpenseReport.fulfilled, (state, action) => {
        state.selectedReport = action.payload;
      })
      .addCase(approveExpenseReport.fulfilled, (state, action) => {
        state.selectedReport = action.payload;
      })
      .addCase(rejectExpenseReport.fulfilled, (state, action) => {
        state.selectedReport = action.payload;
      })
      .addCase(reimburseExpenseReport.fulfilled, (state, action) => {
        state.selectedReport = action.payload;
      });
  },
});

export const {
  setExpenseReportFilters,
  clearExpenseReportFilters,
  clearSelectedExpenseReport,
  clearExpenseReportError,
} = expenseReportSlice.actions;
export default expenseReportSlice.reducer;
