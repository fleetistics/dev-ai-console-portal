import type { Page, Route } from '@playwright/test';

export interface RecordedRequest {
  method: string;
  pathname: string;
  body: unknown;
}

export type Handler = (route: Route, recorded: RecordedRequest) => Promise<void> | void;

export interface ApiMock {
  /** Every /api/* request the page fired, in order. */
  requests: RecordedRequest[];
}

/**
 * Browser-level equivalent of test-utils/mockApi.ts (which mocks fetch for the
 * Vitest/jsdom suite): intercepts every request under /api/ and routes it by
 * `"METHOD /pathname"`, regardless of the configured API host — Playwright's
 * glob matches on the full URL, so this works whatever VITE_BASE_URL resolves
 * to. Unmatched requests get a loud 501 rather than hitting the real network
 * (there is no backend running for these tests) or hanging.
 */
export async function installApiMock(
  page: Page,
  routes: Record<string, Handler>
): Promise<ApiMock> {
  const requests: RecordedRequest[] = [];

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());

    let body: unknown = null;
    const postData = request.postData();
    if (postData) {
      try {
        body = JSON.parse(postData);
      } catch {
        body = postData;
      }
    }

    const recorded: RecordedRequest = { method: request.method(), pathname, body };
    requests.push(recorded);

    const handler = routes[`${recorded.method} ${pathname}`];
    if (!handler) {
      await route.fulfill({
        status: 501,
        contentType: 'application/json',
        body: JSON.stringify({ message: `No mock route for ${recorded.method} ${pathname}` }),
      });
      return;
    }
    await handler(route, recorded);
  });

  return { requests };
}

/**
 * A one-argument route responder. Returns type is inferred (not annotated as
 * Handler) so its declared arity stays at one parameter — a Handler-typed
 * value requires two — letting call sites invoke it directly as
 * `jsonRoute(data)(route)`, not just pass it where a Handler is expected.
 * Assignable to Handler either way: a function declaring fewer parameters
 * than a target type always satisfies that target.
 */
export const jsonRoute =
  (data: unknown, status = 200) =>
  async (route: Route) => {
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
  };
