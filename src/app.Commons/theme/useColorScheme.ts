import { useEffect, useState } from 'react';

export type ColorScheme = 'light' | 'dark' | 'auto';

const STORAGE_KEY = 'color-scheme';

const prefersDarkQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

const isDark = (scheme: ColorScheme): boolean =>
  scheme === 'auto' ? prefersDarkQuery().matches : scheme === 'dark';

const applyScheme = (scheme: ColorScheme): void => {
  // Matches the shadcn preset's `@custom-variant dark (&:is(.dark *));` in globals.css.
  document.documentElement.classList.toggle('dark', isDark(scheme));
};

const getStoredScheme = (): ColorScheme => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'auto' ? stored : 'auto';
};

// Applied synchronously at module load — before React's first paint — so there's no
// flash of the wrong theme while waiting for a useEffect to run. Safe as a top-level
// side effect: this module is reached through App's synchronous import graph before
// main.tsx ever calls render().
applyScheme(getStoredScheme());

/**
 * Small hand-written 3-way (light/dark/auto) theme hook — replaces Mantine's
 * useMantineColorScheme. Not worth a dependency (e.g. next-themes) for a toggle
 * this narrow; same reasoning as the flight recorder's custom-over-heavy approach.
 */
export function useColorScheme() {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(getStoredScheme);

  useEffect(() => {
    applyScheme(colorScheme);
    if (colorScheme !== 'auto') {
      return;
    }

    const mql = prefersDarkQuery();
    const onChange = () => applyScheme('auto');
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [colorScheme]);

  const setColorScheme = (scheme: ColorScheme): void => {
    localStorage.setItem(STORAGE_KEY, scheme);
    setColorSchemeState(scheme);
  };

  return { colorScheme, setColorScheme };
}
