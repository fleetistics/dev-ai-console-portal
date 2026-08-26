import { expect, test } from '@playwright/test';
import { rowWith } from './support/dom';
import { ALICE, BOB, SESSION } from './support/fixtures';
import { installApiMock, jsonRoute } from './support/mockApi';

test('filters the users table and restores it with the clear button', async ({ page }) => {
  await installApiMock(page, {
    'POST /api/auth/CheckSession': jsonRoute(SESSION),
    'GET /api/users': jsonRoute([ALICE, BOB]),
  });

  await page.goto('/users');
  await expect(rowWith(page, 'Alice Anderson')).toBeVisible();
  await expect(rowWith(page, 'Bob Brown')).toBeVisible();

  await page.getByPlaceholder('Filter users...').fill('alice');
  await expect(rowWith(page, 'Bob Brown')).toBeHidden();
  await expect(rowWith(page, 'Alice Anderson')).toBeVisible();

  await page.getByRole('button', { name: 'Clear filter' }).click();
  await expect(rowWith(page, 'Bob Brown')).toBeVisible();
});
