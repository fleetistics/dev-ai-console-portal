import { vi } from 'vitest';

export interface RecordedRequest {
  method: string;
  url: string;
  pathname: string;
  /** Parsed JSON body when the request had one (falls back to the raw text). */
  body: unknown;
}

type RouteReply = (request: Request, recorded: RecordedRequest) => Response | Promise<Response>;

export interface ApiMock {
  /** Every request the component fired, in order — assert on method/pathname/body. */
  requests: RecordedRequest[];
}

export const jsonResponse = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/**
 * Replaces global fetch with a router keyed by `"METHOD /pathname"`, e.g.
 *
 *   const api = installApiMock({
 *     'GET /api/users': () => jsonResponse([alice, bob]),
 *     'PUT /api/users/1': (_req, recorded) => jsonResponse(recorded.body),
 *   });
 *
 * Handlers are functions, so stateful scenarios (a PUT that changes what the next GET
 * returns) are plain closures. Unmatched requests answer 501 with a descriptive body,
 * which makes a missing route show up as an obvious test failure instead of a hang.
 *
 * Restore with vi.unstubAllGlobals() in afterEach.
 */
export function installApiMock(routes: Record<string, RouteReply>): ApiMock {
  const requests: RecordedRequest[] = [];

  const fetchMock = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const request = input instanceof Request ? input : new Request(input, init);
    const { pathname } = new URL(request.url);

    let body: unknown = null;
    const text = await request.clone().text();
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }

    const recorded: RecordedRequest = { method: request.method, url: request.url, pathname, body };
    requests.push(recorded);

    const handler = routes[`${request.method} ${pathname}`];
    if (!handler) {
      return jsonResponse({ message: `No mock route for ${request.method} ${pathname}` }, 501);
    }
    return handler(request, recorded);
  };

  vi.stubGlobal('fetch', fetchMock);
  return { requests };
}
