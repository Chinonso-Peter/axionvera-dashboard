import React, { createContext, useContext, ReactNode } from 'react';
import { useTheme as useNextTheme } from 'next-themes';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme | undefined;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme | undefined;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * @deprecated Use ThemeProvider from next-themes directly in _app.tsx.
 * This wrapper is kept for backward compatibility with the existing useTheme hook.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { theme, setTheme, resolvedTheme } = useNextTheme();

  return (
    <ThemeContext.Provider
      value={{
        theme: theme as Theme,
        setTheme: (t: Theme) => setTheme(t),
        resolvedTheme: resolvedTheme as ResolvedTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
