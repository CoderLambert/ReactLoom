import { create } from 'zustand'

type Theme = 'light' | 'dark'

type ThemeState = {
  theme: Theme
  toggle: () => void
}

function preferredTheme(): Theme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useTheme = create<ThemeState>((set, get) => ({
  theme: preferredTheme(),
  toggle: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
}))
