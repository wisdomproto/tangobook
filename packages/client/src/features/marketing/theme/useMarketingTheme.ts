import { useState, useEffect, useCallback } from 'react';

type MarketingTheme = 'light' | 'dark';

const STORAGE_KEY = 'marketing-theme';

/**
 * Marketing-scoped theme hook.
 * - Reads/persists from localStorage['marketing-theme'] (separate from Tangobook's global theme).
 * - Toggles the `.dark` class on the `.marketing-scope` DOM element (NOT on <html>).
 * - MUST NOT touch Tangobook's theme.store or <html> dark class.
 */
export function useMarketingTheme() {
  const [theme, setThemeState] = useState<MarketingTheme>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {
      // SSR / private browsing fallback
    }
    return 'light';
  });

  // Apply .dark class to all .marketing-scope elements whenever theme changes
  useEffect(() => {
    const roots = document.querySelectorAll<HTMLElement>('.marketing-scope');
    roots.forEach((el) => {
      if (theme === 'dark') {
        el.classList.add('dark');
      } else {
        el.classList.remove('dark');
      }
    });
  }, [theme]);

  const setTheme = useCallback((next: MarketingTheme) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore write errors
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  return { theme, toggle, setTheme } as const;
}
