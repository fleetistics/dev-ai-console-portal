import '@testing-library/jest-dom/vitest';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { vi } from 'vitest';

// Synchronous, network-free, no backend/missingKeyHandler: t('Sign in') with nothing
// loaded just returns the key itself (i18next's default fallback), which is exactly
// the raw English string every component already renders — so existing assertions on
// literal English text keep passing unchanged, with no per-test translation mocking.
// The real network-backed init (src/app.Commons/i18n/i18n.ts) only runs from
// main.tsx, which no test imports, so it never runs here.
void i18next.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { translation: {} } },
  interpolation: { escapeValue: false },
});

const { getComputedStyle } = window;
window.getComputedStyle = (elt) => getComputedStyle(elt);
window.HTMLElement.prototype.scrollIntoView = () => {};

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserver;
