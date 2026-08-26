import { expect, test } from '@playwright/test';
import { rowWith } from './support/dom';
import { ALICE, SESSION } from './support/fixtures';
import { installApiMock, jsonRoute, type RecordedRequest } from './support/mockApi';

test('edits a user, sending only the changed field via PATCH', async ({ page }) => {
  let current = { ...ALICE };
  const api = await installApiMock(page, {
    'POST /api/auth/CheckSession': jsonRoute(SESSION),
    'GET /api/users': async (route) => jsonRoute([current])(route),
    'PATCH /api/users/1': async (route, recorded) => {
      current = { ...current, ...(recorded.body as Partial<typeof ALICE>) };
      await jsonRoute(current)(route);
    },
  });

  await page.goto('/users');
  await expect(rowWith(page, 'Alice Anderson')).toBeVisible();

  await rowWith(page, 'Alice Anderson').getByRole('button', { name: 'Edit user' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Edit user')).toBeVisible();

  const saveButton = dialog.getByRole('button', { name: 'Save' });
  await expect(saveButton).toBeDisabled();

  const displayName = dialog.getByRole('textbox', { name: /display name/i });
  await displayName.fill('Alicia');
  await expect(saveButton).toBeEnabled();
  await saveButton.click();

  await expect(dialog).toBeHidden();
  await expect(rowWith(page, 'Alicia')).toBeVisible();

  // The whole point of the PATCH rewrite: only the changed field goes over
  // the wire, not the full user object.
  const patch = api.requests.find((r: RecordedRequest) => r.method === 'PATCH');
  expect(patch).toBeDefined();
  expect(patch!.pathname).toBe('/api/users/1');
  expect(patch!.body).toEqual({ DisplayName: 'Alicia' });
});
