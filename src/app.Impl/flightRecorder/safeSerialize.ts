/**
 * Serialization for log payloads. Logged values can contain circular references,
 * Errors (which JSON.stringify collapses to {}), DOM nodes, functions and secrets —
 * everything here is defensive so that logging never throws and never persists PII.
 */

const REDACTED = '[REDACTED]';

/** Keys whose values are never persisted, whatever they contain. */
const SENSITIVE_KEY_RE =
  /pass(word)?|token|secret|auth|cookie|bearer|credential|api[-_]?key|ssn|card/i;

/** Values that look like secrets even under an innocent key. */
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/g;
const JWT_RE = /\beyJ[\w-]+\.[\w-]+\.[\w-]+\b/g;
const BEARER_RE = /\bBearer\s+[\w.~+/-]+=*/gi;

export interface SerializeOptions {
  maxDepth?: number;
  maxStringLength?: number;
  /** Hard cap on the resulting JSON string; larger results are truncated. */
  maxBytes?: number;
}

const redactString = (value: string, maxStringLength: number): string => {
  let result = value
    .replace(JWT_RE, REDACTED)
    .replace(BEARER_RE, REDACTED)
    .replace(EMAIL_RE, REDACTED);
  if (result.length > maxStringLength) {
    result = `${result.slice(0, maxStringLength)}…[+${result.length - maxStringLength} chars]`;
  }
  return result;
};

const toPlain = (
  value: unknown,
  depth: number,
  seen: WeakSet<object>,
  opts: Required<SerializeOptions>
): unknown => {
  if (value === null || value === undefined) {
    return value;
  }

  const type = typeof value;
  if (type === 'string') {
    return redactString(value as string, opts.maxStringLength);
  }
  if (type === 'number' || type === 'boolean') {
    return value;
  }
  if (type === 'bigint') {
    return `${String(value)}n`;
  }
  if (type === 'function') {
    return `[Function ${(value as { name?: string }).name || 'anonymous'}]`;
  }
  if (type === 'symbol') {
    return String(value);
  }

  // From here on, value is an object.
  const obj = value as object;

  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: redactString(obj.message, opts.maxStringLength),
      stack: obj.stack ? redactString(obj.stack, opts.maxStringLength) : undefined,
    };
  }
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  if (typeof Node !== 'undefined' && obj instanceof Node) {
    return `[DOM <${obj.nodeName.toLowerCase()}>]`;
  }

  if (seen.has(obj)) {
    return '[Circular]';
  }
  if (depth >= opts.maxDepth) {
    return Array.isArray(obj) ? `[Array(${obj.length})]` : '[Object]';
  }
  seen.add(obj);

  if (Array.isArray(obj)) {
    return obj.slice(0, 100).map((item) => toPlain(item, depth + 1, seen, opts));
  }

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    out[key] = SENSITIVE_KEY_RE.test(key) ? REDACTED : toPlain(val, depth + 1, seen, opts);
  }
  return out;
};

/** Never throws: a value that defeats serialization becomes a diagnostic string. */
export function safeSerialize(value: unknown, options: SerializeOptions = {}): string {
  const opts: Required<SerializeOptions> = {
    maxDepth: options.maxDepth ?? 4,
    maxStringLength: options.maxStringLength ?? 2000,
    maxBytes: options.maxBytes ?? 8192,
  };
  try {
    let json = JSON.stringify(toPlain(value, 0, new WeakSet(), opts));
    if (json && json.length > opts.maxBytes) {
      json = JSON.stringify(`${json.slice(0, opts.maxBytes)}…[truncated]`);
    }
    return json ?? 'undefined';
  } catch (error) {
    return JSON.stringify(
      `[Unserializable: ${error instanceof Error ? error.message : 'unknown'}]`
    );
  }
}

/** Formats console-style argument lists into a single message string. */
export function formatArgs(args: unknown[]): string {
  return args
    .map((arg) => {
      if (typeof arg === 'string') {
        return arg;
      }
      if (arg instanceof Error) {
        return `${arg.name}: ${arg.message}`;
      }
      return safeSerialize(arg, { maxBytes: 1024 });
    })
    .join(' ');
}
