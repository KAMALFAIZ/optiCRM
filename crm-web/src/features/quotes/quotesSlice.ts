import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { quotesApi, QuotesQueryParams } from '@/api/quotes';
import {
  Quote,
  QuoteListItem,
  CreateQuoteRequest,
  UpdateQuoteRequest,
  QuoteStatus,
} from '@/types/quote';
import { PageMeta } from '@/types/api';

interface QuotesState {
  items: QuoteListItem[];
  currentQuote: Quote | null;
  meta: PageMeta | null;
  loading: boolean;
  error: string | null;
  queryParams: QuotesQueryParams;
}

const initialState: QuotesState = {
  items: [],
  currentQuote: null,
  meta: null,
  loading: false,
  error: null,
  queryParams: {
    page: 1,
    size: 20,
    sortBy: 'createdAt',
    sortDirection: 'desc',
  },
};

export const fetchQuotes = createAsyncThunk(
  'quotes/fetchAll',
  async (params: QuotesQueryParams, { rejectWithValue }) => {
    try {
      return await quotesApi.getAll(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Erreur lors du chargement des devis');
    }
  }
);

export const fetchQuoteById = createAsyncThunk(
  'quotes/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await quotesApi.getById(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Devis non trouvé');
    }
  }
);

export const createQuote = createAsyncThunk(
  'quotes/create',
  async (data: CreateQuoteRequest, { rejectWithValue }) => {
    try {
      return await quotesApi.create(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Erreur lors de la création');
    }
  }
);

export const updateQuote = createAsyncThunk(
  'quotes/update',
  async ({ id, data }: { id: string; data: UpdateQuoteRequest }, { rejectWithValue }) => {
    try {
      return await quotesApi.update(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Erreur lors de la mise à jour');
    }
  }
);

export const deleteQuote = createAsyncThunk(
  'quotes/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await quotesApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Erreur lors de la suppression');
    }
  }
);

export const updateQuoteStatus = createAsyncThunk(
  'quotes/updateStatus',
  async ({ id, status }: { id: string; status: QuoteStatus }, { rejectWithValue }) => {
    try {
      return await quotesApi.updateStatus(id, status);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Erreur lors de la mise à jour du statut');
    }
  }
);

export const duplicateQuote = createAsyncThunk(
  'quotes/duplicate',
  async (id: string, { rejectWithValue }) => {
    try {
      return await quotesApi.duplicate(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Erreur lors de la duplication');
    }
  }
);

const quotesSlice = createSlice({
  name: 'quotes',
  initialState,
  reducers: {
    setQueryParams: (state, action: PayloadAction<Partial<QuotesQueryParams>>) => {
      state.queryParams = { ...state.queryParams, ...action.payload };
    },
    clearCurrentQuote: (state) => {
      state.currentQuote = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchQuotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuotes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.content;
        state.meta = {
          page: action.payload.page,
          size: action.payload.size,
          totalElements: action.payload.totalElements,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchQuotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch by ID
      .addCase(fetchQuoteById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuoteById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentQuote = action.payload;
      })
      .addCase(fetchQuoteById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create
      .addCase(createQuote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createQuote.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createQuote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update
      .addCase(updateQuote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateQuote.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = {
            ...state.items[index],
            name: action.payload.name,
            status: action.payload.status,
            total: action.payload.total,
            subtotal: action.payload.subtotal,
            validUntil: action.payload.validUntil,
          };
        }
        if (state.currentQuote?.id === action.payload.id) {
          state.currentQuote = action.payload;
        }
      })
      .addCase(updateQuote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete
      .addCase(deleteQuote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteQuote.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((item) => item.id !== action.payload);
        if (state.meta) {
          state.meta.totalElements -= 1;
        }
      })
      .addCase(deleteQuote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update status
      .addCase(updateQuoteStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateQuoteStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index].status = action.payload.status;
        }
        if (state.currentQuote?.id === action.payload.id) {
          state.currentQuote = action.payload;
        }
      })
      .addCase(updateQuoteStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Duplicate
      .addCase(duplicateQuote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(duplicateQuote.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(duplicateQuote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setQueryParams, clearCurrentQuote, clearError } = quotesSlice.actions;
export default quotesSlice.reducer;
