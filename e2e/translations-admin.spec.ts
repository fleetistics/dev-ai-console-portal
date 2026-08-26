import { expect, test } from '@playwright/test';
import { SESSION } from './support/fixtures';
import { installApiMock, jsonRoute, type RecordedRequest } from './support/mockApi';

test('edits a translation and adds a new language from the admin page', async ({ page }) => {
  let languages = [{ Code: 'es', EnglishName: 'Spanish', NativeName: 'Español', IsEnabled: true }];
  let cancelTranslation: string | null = null;

  const api = await installApiMock(page, {
    'POST /api/auth/CheckSession': jsonRoute(SESSION),
    'GET /api/languages/all': async (route) => jsonRoute(languages)(route),
    'GET /api/translations/es/tokens': async (route) =>
      jsonRoute([
        {
          TokenId: 1,
          Text: 'Cancel',
          Context: null,
          Translation: cancelTranslation,
          ReportCount: 4,
          LastSeenAt: 1700000000,
        },
      ])(route),
    'PATCH /api/translations/es/1': async (route, recorded) => {
      const body = recorded.body as { TranslatedText: string | null };
      cancelTranslation = body.TranslatedText;
      await jsonRoute({ Text: 'Cancel', Translation: cancelTranslation })(route);
    },
    'POST /api/languages': async (route, recorded) => {
      const body = recorded.body as (typeof languages)[number];
      languages = [...languages, body];
      await jsonRoute(body)(route);
    },
  });

  await page.goto('/translations');
  await expect(page.getByRole('heading', { name: 'Translations' })).toBeVisible();

  // Edit an existing token's translation via the edit modal.
  await page.getByRole('button', { name: 'Edit translation' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Edit translation' })).toBeVisible();

  const saveButton = dialog.getByRole('button', { name: 'Save' });
  await expect(saveButton).toBeDisabled();
  await dialog.getByRole('textbox', { name: 'Translation' }).fill('Cancelar');
  await expect(saveButton).toBeEnabled();
  await saveButton.click();

  await expect(dialog).toBeHidden();
  await expect
    .poll(() => {
      const patch = api.requests.find(
        (r: RecordedRequest) => r.method === 'PATCH' && r.pathname === '/api/translations/es/1'
      );
      return patch?.body;
    })
    .toEqual({ TranslatedText: 'Cancelar' });
  await expect(page.getByRole('cell', { name: 'Cancelar' })).toBeVisible();

  // Add a new language through the add-language modal.
  await page.getByRole('button', { name: 'Add language' }).click();
  const languageDialog = page.getByRole('dialog');
  await expect(languageDialog.getByRole('heading', { name: 'Add language' })).toBeVisible();

  await languageDialog.getByRole('textbox', { name: /code/i }).fill('fr');
  await languageDialog.getByRole('textbox', { name: /english name/i }).fill('French');
  await languageDialog.getByRole('textbox', { name: /native name/i }).fill('Français');
  await languageDialog.getByRole('button', { name: 'Save' }).click();

  await expect(languageDialog).toBeHidden();
  await expect
    .poll(() => {
      const post = api.requests.find(
        (r: RecordedRequest) => r.method === 'POST' && r.pathname === '/api/languages'
      );
      return post?.body;
    })
    .toEqual({ Code: 'fr', EnglishName: 'French', NativeName: 'Français', IsEnabled: true });
  await expect(page.getByRole('cell', { name: 'Français' })).toBeVisible();
});
