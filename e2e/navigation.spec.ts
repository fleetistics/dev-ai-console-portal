import { expect, test } from '@playwright/test';
import { SESSION } from './support/fixtures';
import { installApiMock, jsonRoute } from './support/mockApi';

test('navigates to the Users page, lazily loading its chunk, with active-link highlighting', async ({
  page,
}) => {
  await installApiMock(page, {
    'POST /api/auth/CheckSession': jsonRoute(SESSION),
    'GET /api/users': jsonRoute([]),
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: /welcome to/i })).toBeVisible();

  const usersLink = page.getByRole('link', { name: 'Users' });
  await expect(usersLink).not.toHaveAttribute('aria-current', 'page');

  // Users.page.tsx is behind router-level lazy() (see src/Router.tsx) — this
  // waits for the actual dynamic-import request the click triggers, proving
  // the chunk isn't part of the initial bundle.
  const chunkRequest = page.waitForRequest((req) => req.url().includes('Users.page'));
  await usersLink.click();
  await chunkRequest;

  await expect(page).toHaveURL(/\/users$/);
  await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
  await expect(usersLink).toHaveAttribute('aria-current', 'page');
});
