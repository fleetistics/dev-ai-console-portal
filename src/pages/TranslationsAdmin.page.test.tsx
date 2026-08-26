import {
  installApiMock,
  jsonResponse,
  renderApp,
  screen,
  userEvent,
  waitFor,
  within,
} from '@test-utils';
import type { Language, TranslationTokenAdmin } from '@/app.Commons/i18n/translationTypes';
import { TranslationsAdminPage } from './TranslationsAdmin.page';

const spanish: Language = {
  Code: 'es',
  EnglishName: 'Spanish',
  NativeName: 'Español',
  IsEnabled: true,
};
const french: Language = {
  Code: 'fr',
  EnglishName: 'French',
  NativeName: 'Français',
  IsEnabled: false,
};

const cancelToken: TranslationTokenAdmin = {
  TokenId: 1,
  Text: 'Cancel',
  Context: null,
  Translation: null,
  ReportCount: 3,
  LastSeenAt: 1700000000,
};
const saveToken: TranslationTokenAdmin = {
  TokenId: 2,
  Text: 'Save',
  Context: null,
  Translation: 'Guardar',
  ReportCount: 5,
  LastSeenAt: 1700000001,
};

beforeAll(() => {
  vi.stubEnv('VITE_BASE_URL', 'http://api.test');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe('TranslationsAdminPage', () => {
  it('lists languages and defaults to the first target language’s tokens', async () => {
    installApiMock({
      'GET /api/languages/all': () => jsonResponse([spanish]),
      'GET /api/translations/es/tokens': () => jsonResponse([cancelToken, saveToken]),
    });
    renderApp(<TranslationsAdminPage />);

    expect(await screen.findByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Guardar')).toBeInTheDocument();
    expect(screen.getByText(/not translated/i)).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Español' })).toBeInTheDocument();
  });

  it('shows a hint instead of a token table when no target language exists yet', async () => {
    installApiMock({ 'GET /api/languages/all': () => jsonResponse([]) });
    renderApp(<TranslationsAdminPage />);

    expect(await screen.findByText(/add a language above/i)).toBeInTheDocument();
  });

  it('filters tokens by search text', async () => {
    installApiMock({
      'GET /api/languages/all': () => jsonResponse([spanish]),
      'GET /api/translations/es/tokens': () => jsonResponse([cancelToken, saveToken]),
    });
    const user = userEvent.setup();
    renderApp(<TranslationsAdminPage />);
    await screen.findByText('Cancel');

    await user.type(screen.getByPlaceholderText('Filter by text...'), 'save');

    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('filters to only untranslated tokens', async () => {
    installApiMock({
      'GET /api/languages/all': () => jsonResponse([spanish]),
      'GET /api/translations/es/tokens': () => jsonResponse([cancelToken, saveToken]),
    });
    const user = userEvent.setup();
    renderApp(<TranslationsAdminPage />);
    await screen.findByText('Cancel');

    await user.click(screen.getByRole('checkbox', { name: /only untranslated/i }));

    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  it('edits a translation through the edit modal', async () => {
    let stored = { ...cancelToken };
    const api = installApiMock({
      'GET /api/languages/all': () => jsonResponse([spanish]),
      'GET /api/translations/es/tokens': () => jsonResponse([stored]),
      'PATCH /api/translations/es/1': (_request, recorded) => {
        const patch = recorded.body as { TranslatedText: string | null };
        stored = { ...stored, Translation: patch.TranslatedText };
        return jsonResponse({ Text: stored.Text, Translation: stored.Translation });
      },
    });
    const user = userEvent.setup();
    renderApp(<TranslationsAdminPage />);
    await screen.findByText('Cancel');

    await user.click(screen.getByRole('button', { name: 'Edit translation' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Edit translation' })).toBeInTheDocument();

    const saveButton = within(dialog).getByRole('button', { name: 'Save' });
    expect(saveButton).toBeDisabled();

    const translationInput = within(dialog).getByRole('textbox', { name: 'Translation' });
    await user.type(translationInput, 'Cancelar');
    expect(saveButton).toBeEnabled();
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(await screen.findByText('Cancelar')).toBeInTheDocument();

    const patch = api.requests.find((r) => r.method === 'PATCH');
    expect(patch?.body).toEqual({ TranslatedText: 'Cancelar' });
  });

  it('does not save when the edit modal is cancelled', async () => {
    const api = installApiMock({
      'GET /api/languages/all': () => jsonResponse([spanish]),
      'GET /api/translations/es/tokens': () => jsonResponse([saveToken]),
    });
    const user = userEvent.setup();
    renderApp(<TranslationsAdminPage />);
    await screen.findByText('Save');

    await user.click(screen.getByRole('button', { name: 'Edit translation' }));
    const dialog = await screen.findByRole('dialog');
    await user.clear(within(dialog).getByRole('textbox', { name: 'Translation' }));
    await user.type(within(dialog).getByRole('textbox', { name: 'Translation' }), 'x');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(api.requests.some((r) => r.method === 'PATCH')).toBe(false);
    expect(screen.getByText('Guardar')).toBeInTheDocument();
  });

  it('adds a new language through the add-language modal', async () => {
    const api = installApiMock({
      'GET /api/languages/all': () => jsonResponse([]),
      'POST /api/languages': (_request, recorded) => jsonResponse(recorded.body),
    });
    const user = userEvent.setup();
    renderApp(<TranslationsAdminPage />);
    await screen.findByText(/add a language above/i);

    await user.click(screen.getByRole('button', { name: 'Add language' }));
    const dialog = await screen.findByRole('dialog');
    const saveButton = within(dialog).getByRole('button', { name: 'Save' });
    expect(saveButton).toBeDisabled();

    await user.type(within(dialog).getByRole('textbox', { name: /code/i }), 'fr');
    await user.type(within(dialog).getByRole('textbox', { name: /english name/i }), 'French');
    await user.type(within(dialog).getByRole('textbox', { name: /native name/i }), 'Français');
    expect(saveButton).toBeEnabled();
    await user.click(saveButton);

    await waitFor(() => {
      const post = api.requests.find((r) => r.method === 'POST');
      expect(post?.body).toEqual({
        Code: 'fr',
        EnglishName: 'French',
        NativeName: 'Français',
        IsEnabled: true,
      });
    });
  });

  it('edits a language and toggles it enabled through the edit modal', async () => {
    const api = installApiMock({
      'GET /api/languages/all': () => jsonResponse([french]),
      'GET /api/translations/fr/tokens': () => jsonResponse([]),
      'POST /api/languages': (_request, recorded) => jsonResponse(recorded.body),
    });
    const user = userEvent.setup();
    renderApp(<TranslationsAdminPage />);
    await screen.findByRole('cell', { name: 'Français' });
    expect(screen.getByText('Disabled')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Edit language' }));
    const dialog = await screen.findByRole('dialog');
    // The code is the language's identity — only settable when creating.
    expect(within(dialog).getByRole('textbox', { name: /code/i })).toBeDisabled();

    await user.click(within(dialog).getByRole('checkbox', { name: 'Enabled' }));
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      const post = api.requests.find((r) => r.method === 'POST');
      expect(post?.body).toEqual({ ...french, IsEnabled: true });
    });
  });
});
