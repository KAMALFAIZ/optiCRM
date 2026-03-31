import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'opticrm_theme';

function getInitialTheme(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return 'light';
}

function applyThemeToDOM(mode: ThemeMode) {
  document.documentElement.dataset.theme = mode;
}

interface ThemeState {
  mode: ThemeMode;
}

const initialMode = getInitialTheme();
applyThemeToDOM(initialMode);

const initialState: ThemeState = {
  mode: initialMode,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      localStorage.setItem(STORAGE_KEY, state.mode);
      applyThemeToDOM(state.mode);
    },
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
      localStorage.setItem(STORAGE_KEY, state.mode);
      applyThemeToDOM(state.mode);
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export const selectThemeMode = (state: RootState) => state.theme.mode;
export default themeSlice.reducer;
