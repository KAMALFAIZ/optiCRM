import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';

export type ThemeMode = 'light' | 'dark';
export type Density = 'compact' | 'default' | 'comfortable';

const STORAGE_KEY = 'opticrm_theme';
const DENSITY_KEY = 'opticrm_density';

function getInitialTheme(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return 'light';
}

function getInitialDensity(): Density {
  const stored = localStorage.getItem(DENSITY_KEY);
  if (stored === 'compact' || stored === 'default' || stored === 'comfortable') return stored;
  return 'default';
}

function applyThemeToDOM(mode: ThemeMode) {
  document.documentElement.dataset.theme = mode;
}

function applyDensityToDOM(density: Density) {
  document.documentElement.dataset.density = density;
}

interface ThemeState {
  mode: ThemeMode;
  density: Density;
}

const initialMode = getInitialTheme();
const initialDensity = getInitialDensity();
applyThemeToDOM(initialMode);
applyDensityToDOM(initialDensity);

const initialState: ThemeState = {
  mode: initialMode,
  density: initialDensity,
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
    setDensity: (state, action: PayloadAction<Density>) => {
      state.density = action.payload;
      localStorage.setItem(DENSITY_KEY, state.density);
      applyDensityToDOM(state.density);
    },
  },
});

export const { toggleTheme, setTheme, setDensity } = themeSlice.actions;
export const selectThemeMode = (state: RootState) => state.theme.mode;
export const selectDensity = (state: RootState) => state.theme.density;
export default themeSlice.reducer;
