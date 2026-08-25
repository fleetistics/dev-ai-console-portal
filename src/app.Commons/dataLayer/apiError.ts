/**
 * Turns an RTK Query error (FetchBaseQueryError | SerializedError | unknown) into
 * something a user can read. The server answers errors in two shapes — plain
 * `{ message }` from explicit controller responses (400/404/401), and RFC 7807
 * ProblemDetails from the global exception handler and model validation — this
 * covers both, plus RTK's own network/timeout/parsing failure shapes.
 */

interface HttpErrorLike {
  status?: unknown;
  data?: unknown;
  error?: string;
}

const isHttpErrorLike = (error: unknown): error is HttpErrorLike =>
  typeof error === 'object' && error !== null && 'status' in error;

/** HTTP status code, or undefined for network/timeout/parsing failures. */
export const getErrorStatus = (error: unknown): number | undefined => {
  const status = isHttpErrorLike(error) ? error.status : undefined;
  return typeof status === 'number' ? status : undefined;
};

/** The traceId a ProblemDetails response carries, for a "support code" display. */
export const getErrorTraceId = (error: unknown): string | undefined => {
  const data = isHttpErrorLike(error) ? error.data : undefined;
  const traceId = (data as { traceId?: unknown } | undefined)?.traceId;
  return typeof traceId === 'string' ? traceId : undefined;
};

export const getErrorMessage = (error: unknown, fallback = 'Something went wrong.'): string => {
  if (!isHttpErrorLike(error)) {
    // SerializedError (e.g. from a rejected mutation thunk) or a plain Error.
    const message = (error as { message?: unknown })?.message;
    return typeof message === 'string' && message ? message : fallback;
  }

  const data = error.data as
    | { message?: unknown; detail?: unknown; title?: unknown; errors?: Record<string, string[]> }
    | undefined;

  if (typeof data?.message === 'string' && data.message) {
    return data.message;
  }
  if (typeof data?.detail === 'string' && data.detail) {
    return data.detail;
  }
  if (data?.errors) {
    const firstField = Object.values(data.errors)[0];
    if (firstField?.[0]) {
      return firstField[0];
    }
  }
  if (typeof data?.title === 'string' && data.title) {
    return data.title;
  }

  // RTK's own failure modes: FETCH_ERROR / TIMEOUT_ERROR / PARSING_ERROR / CUSTOM_ERROR
  // carry a description in `error`, not `data`.
  if (typeof error.error === 'string' && error.error) {
    return error.error;
  }

  if (typeof error.status === 'number') {
    return `Request failed with status ${error.status}.`;
  }
  return fallback;
};
