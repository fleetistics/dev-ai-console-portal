import { useEffect } from 'react';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useGlobals } from 'storybook/preview-api';
import { TooltipProvider } from '../src/components/ui/tooltip';
import '../src/globals.css';

// Same synchronous, network-free, backend-less init as vitest.setup.mjs: Storybook
// never runs main.tsx's real initI18n(), so without this, useTranslation() has no
// initialized instance to read from — react-i18next's default `useSuspense: true`
// then suspends indefinitely, which breaks components nested under other context
// providers (e.g. ReportProblemButton's Tooltip) that don't expect to be suspended.
void i18next.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { translation: {} } },
  interpolation: { escapeValue: false },
});

export const parameters = {
  layout: 'fullscreen',
  options: {
    showPanel: false,
    // @ts-expect-error – storybook throws build error for (a: any, b: any)
    storySort: (a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }),
  },
  backgrounds: { disable: true },
};

export const globalTypes = {
  theme: {
    name: 'Theme',
    description: 'Color scheme',
    defaultValue: 'light',
    toolbar: {
      icon: 'mirror',
      items: [
        { value: 'light', title: 'Light' },
        { value: 'dark', title: 'Dark' },
      ],
    },
  },
};

export const decorators = [
  (renderStory: any, context: any) => {
    const [{ theme: storybookTheme }, updateGlobals] = useGlobals();

    useEffect(() => {
      const onKeyDown = (event: KeyboardEvent) => {
        const isMod = event.metaKey || event.ctrlKey;
        const isJ = event.code === 'KeyJ';

        if (!isMod || !isJ) {
          return;
        }

        event.preventDefault();
        updateGlobals({ theme: storybookTheme === 'dark' ? 'light' : 'dark' });
      };

      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }, [storybookTheme, updateGlobals]);

    const scheme = (context.globals.theme || 'light') as 'light' | 'dark';

    useEffect(() => {
      document.documentElement.classList.toggle('dark', scheme === 'dark');
    }, [scheme]);

    return <TooltipProvider>{renderStory()}</TooltipProvider>;
  },
];
