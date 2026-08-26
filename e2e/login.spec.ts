import { expect, test } from '@playwright/test';
import { SESSION } from './support/fixtures';
import { installApiMock, jsonRoute } from './support/mockApi';

test('shows an error on wrong credentials, then logs in and reaches the app', async ({ page }) => {
  let authenticated = false;
  await installApiMock(page, {
    'POST /api/auth/CheckSession': async (route) =>
      authenticated ? jsonRoute(SESSION)(route) : jsonRoute({ message: 'no session' }, 401)(route),
    'POST /api/auth/login': async (route, recorded) => {
      const body = recorded.body as { UserName: string; Password: string };
      if (body.UserName === 'alice' && body.Password === 'secret') {
        authenticated = true;
        await jsonRoute(SESSION)(route);
      } else {
        await jsonRoute({ message: 'Invalid username or password.' }, 401)(route);
      }
    },
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();

  await page.getByLabel(/^username/i).fill('alice');
  await page.getByLabel(/^password/i).fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Invalid username or password')).toBeVisible();

  // NoAuthUI's login mounts its own router — Sign in must still be reachable
  // after a failed attempt, not stuck on an error screen.
  await page.getByLabel(/^password/i).fill('secret');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeHidden();
  await expect(page.getByRole('heading', { name: /welcome to/i })).toBeVisible();
});

test('an already-valid session skips the login screen entirely', async ({ page }) => {
  await installApiMock(page, {
    'POST /api/auth/CheckSession': jsonRoute(SESSION),
  });

  await page.goto('/');

  await expect(page.getByRole('heading', { name: /welcome to/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sign in' })).not.toBeVisible();
});
