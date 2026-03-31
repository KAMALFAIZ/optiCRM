import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import invoicesApi, { InvoiceFilters } from '@/api/invoices';
import {
  Invoice,
  InvoiceListItem,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  InvoiceStats,
  InvoiceStatus,
} from '@/types/invoice';

interface InvoicesState {
  invoices: InvoiceListItem[];
  selectedInvoice: Invoice | null;
  stats: InvoiceStats | null;
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
    status?: InvoiceStatus;
    startDate?: string;
    endDate?: string;
    search?: string;
    page: number;
    size: number;
    sortBy: string;
    sortDir: 'asc' | 'desc';
  };
}

const initialState: InvoicesState = {
  invoices: [],
  selectedInvoice: null,
  stats: null,
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
    sortBy: 'invoiceDate',
    sortDir: 'desc',
  },
};

export const fetchInvoices = createAsyncThunk(
  'invoices/fetchInvoices',
  async (filters: InvoiceFilters) => {
    const response = await invoicesApi.getAll(filters);
    return response.data;
  }
);

export const fetchInvoiceById = createAsyncThunk(
  'invoices/fetchInvoiceById',
  async (id: string) => {
    const response = await invoicesApi.getById(id);
    return response.data;
  }
);

export const fetchInvoiceStats = createAsyncThunk(
  'invoices/fetchInvoiceStats',
  async () => {
    const response = await invoicesApi.getStats();
    return response.data;
  }
);

export const createInvoice = createAsyncThunk(
  'invoices/createInvoice',
  async (data: CreateInvoiceRequest, { rejectWithValue }) => {
    try {
      const response = await invoicesApi.create(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la création');
    }
  }
);

export const updateInvoice = createAsyncThunk(
  'invoices/updateInvoice',
  async ({ id, data }: { id: string; data: UpdateInvoiceRequest }, { rejectWithValue }) => {
    try {
      const response = await invoicesApi.update(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  }
);

export const deleteInvoice = createAsyncThunk(
  'invoices/deleteInvoice',
  async (id: string, { rejectWithValue }) => {
    try {
      await invoicesApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors de la suppression');
    }
  }
);

export const sendInvoice = createAsyncThunk(
  'invoices/sendInvoice',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await invoicesApi.send(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || "Erreur lors de l'envoi");
    }
  }
);

export const markInvoicePaid = createAsyncThunk(
  'invoices/markInvoicePaid',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await invoicesApi.markPaid(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || 'Erreur lors du marquage');
    }
  }
);

export const cancelInvoice = createAsyncThunk(
  'invoices/cancelInvoice',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await invoicesApi.cancel(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || error.response?.data?.message || "Erreur lors de l'annulation");
    }
  }
);

const invoicesSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    setInvoiceFilters: (state, action: PayloadAction<Partial<InvoicesState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearInvoiceFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearSelectedInvoice: (state) => {
      state.selectedInvoice = null;
    },
    clearInvoiceError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch invoices
      .addCase(fetchInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.invoices = action.payload.content;
          state.pagination = {
            page: action.payload.page,
            size: action.payload.size,
            totalElements: action.payload.totalElements,
            totalPages: action.payload.totalPages,
          };
        }
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erreur lors du chargement des factures';
      })
      // Fetch invoice by ID
      .addCase(fetchInvoiceById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoiceById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedInvoice = action.payload ?? null;
      })
      .addCase(fetchInvoiceById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erreur lors du chargement de la facture';
      })
      // Fetch stats
      .addCase(fetchInvoiceStats.fulfilled, (state, action) => {
        state.stats = action.payload ?? null;
      })
      // Create invoice
      .addCase(createInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createInvoice.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update invoice
      .addCase(updateInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedInvoice = action.payload ?? null;
      })
      .addCase(updateInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete invoice
      .addCase(deleteInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.invoices = state.invoices.filter((i) => i.id !== action.payload);
      })
      .addCase(deleteInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Send invoice
      .addCase(sendInvoice.fulfilled, (state) => {
        state.loading = false;
      })
      // Mark paid
      .addCase(markInvoicePaid.fulfilled, (state) => {
        state.loading = false;
      })
      // Cancel
      .addCase(cancelInvoice.fulfilled, (state) => {
        state.loading = false;
      });
  },
});

export const { setInvoiceFilters, clearInvoiceFilters, clearSelectedInvoice, clearInvoiceError } =
  invoicesSlice.actions;
export default invoicesSlice.reducer;
