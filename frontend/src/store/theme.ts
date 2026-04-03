import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  initializeTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const themeStorageKey = 'ys-theme';

function readThemeFromDom(): ThemeMode {
  const domValue = document.documentElement.getAttribute('data-theme');
  return domValue === 'light' ? 'light' : 'dark';
}

function persistTheme(mode: ThemeMode): void {
  try {
    localStorage.setItem(themeStorageKey, mode);
  } catch {
    // Ignore storage write failures in restricted contexts.
  }
}

function applyTheme(mode: ThemeMode): void {
  document.documentElement.setAttribute('data-theme', mode);
}

function resolveInitialTheme(): ThemeMode {
  const domTheme = readThemeFromDom();
  if (domTheme === 'light' || domTheme === 'dark') {
    return domTheme;
  }

  try {
    const stored = localStorage.getItem(themeStorageKey);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // Ignore storage read failures.
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'dark',
  initializeTheme: () => {
    if (typeof window === 'undefined') return;
    const next = resolveInitialTheme();
    applyTheme(next);
    set({ mode: next });
  },
  setTheme: (mode) => {
    if (typeof window !== 'undefined') {
      applyTheme(mode);
      persistTheme(mode);
    }
    set({ mode });
  },
  toggleTheme: () => {
    const current = get().mode;
    const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  }
}));
