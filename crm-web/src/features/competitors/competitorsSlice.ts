import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { competitorsApi, CompetitorsQueryParams } from '@/api/competitors';
import { Competitor, CreateCompetitorRequest, UpdateCompetitorRequest } from '@/types/competitor';

interface CompetitorsState {
  items: Competitor[];
  selectedCompetitor: Competitor | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

const initialState: CompetitorsState = {
  items: [],
  selectedCompetitor: null,
  loading: false,
  error: null,
  pagination: { page: 1, size: 20, totalElements: 0, totalPages: 0 },
};

export const fetchCompetitors = createAsyncThunk('competitors/fetchAll', async (params: CompetitorsQueryParams) => {
  return competitorsApi.getAll(params);
});

export const fetchCompetitorById = createAsyncThunk('competitors/fetchById', async (id: string) => {
  return competitorsApi.getById(id);
});

export const createCompetitor = createAsyncThunk('competitors/create', async (data: CreateCompetitorRequest) => {
  return competitorsApi.create(data);
});

export const updateCompetitor = createAsyncThunk('competitors/update', async ({ id, data }: { id: string; data: UpdateCompetitorRequest }) => {
  return competitorsApi.update(id, data);
});

export const deleteCompetitor = createAsyncThunk('competitors/delete', async (id: string) => {
  await competitorsApi.delete(id);
  return id;
});

const competitorsSlice = createSlice({
  name: 'competitors',
  initialState,
  reducers: {
    clearSelectedCompetitor: (state) => {
      state.selectedCompetitor = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompetitors.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCompetitors.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.content;
        state.pagination = {
          page: action.payload.page,
          size: action.payload.size,
          totalElements: action.payload.totalElements,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchCompetitors.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Erreur'; })

      .addCase(fetchCompetitorById.fulfilled, (state, action) => { state.selectedCompetitor = action.payload; })

      .addCase(createCompetitor.fulfilled, (state, action) => { state.items.unshift(action.payload); })
      .addCase(updateCompetitor.fulfilled, (state, action) => {
        const idx = state.items.findIndex((c) => c.id === action.payload.id);
        if (idx >= 0) state.items[idx] = action.payload;
      })
      .addCase(deleteCompetitor.fulfilled, (state, action) => {
        state.items = state.items.filter((c) => c.id !== action.payload);
      });
  },
});

export const { clearSelectedCompetitor } = competitorsSlice.actions;
export default competitorsSlice.reducer;
