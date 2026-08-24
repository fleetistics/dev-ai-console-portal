import { formatArgs, safeSerialize } from './safeSerialize';

describe('safeSerialize', () => {
  it('serializes plain objects', () => {
    expect(JSON.parse(safeSerialize({ a: 1, b: 'x' }))).toEqual({ a: 1, b: 'x' });
  });

  it('handles circular references without throwing', () => {
    const obj: Record<string, unknown> = { name: 'root' };
    obj.self = obj;
    const parsed = JSON.parse(safeSerialize(obj));
    expect(parsed.name).toBe('root');
    expect(parsed.self).toBe('[Circular]');
  });

  it('serializes Error instances with message and stack', () => {
    const parsed = JSON.parse(safeSerialize(new Error('boom')));
    expect(parsed.name).toBe('Error');
    expect(parsed.message).toBe('boom');
    expect(typeof parsed.stack).toBe('string');
  });

  it('redacts values under sensitive keys', () => {
    const parsed = JSON.parse(
      safeSerialize({ password: 'hunter2', accessToken: 'abc', apiKey: 'k', safe: 'ok' })
    );
    expect(parsed.password).toBe('[REDACTED]');
    expect(parsed.accessToken).toBe('[REDACTED]');
    expect(parsed.apiKey).toBe('[REDACTED]');
    expect(parsed.safe).toBe('ok');
  });

  it('redacts emails and JWTs inside string values', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.sig-part';
    const parsed = JSON.parse(safeSerialize({ note: `mail me at user@example.com jwt ${jwt}` }));
    expect(parsed.note).not.toContain('user@example.com');
    expect(parsed.note).not.toContain('eyJ');
    expect(parsed.note).toContain('[REDACTED]');
  });

  it('caps depth', () => {
    const deep = { l1: { l2: { l3: { l4: { l5: { l6: 'too deep' } } } } } };
    const parsed = JSON.parse(safeSerialize(deep, { maxDepth: 3 }));
    expect(parsed.l1.l2.l3).toBe('[Object]');
  });

  it('caps long strings', () => {
    const parsed = JSON.parse(safeSerialize({ s: 'x'.repeat(5000) }, { maxStringLength: 100 }));
    expect(parsed.s.length).toBeLessThan(200);
    expect(parsed.s).toContain('[+4900 chars]');
  });

  it('caps total payload size', () => {
    const big = { arr: Array.from({ length: 50 }, () => 'y'.repeat(500)) };
    const result = safeSerialize(big, { maxBytes: 1000 });
    expect(result.length).toBeLessThan(1500);
    expect(result).toContain('[truncated]');
  });

  it('handles functions, symbols, bigints and undefined', () => {
    expect(safeSerialize(undefined)).toBe('undefined');
    const parsed = JSON.parse(
      safeSerialize({ fn: function named() {}, sym: Symbol('s'), big: 10n })
    );
    expect(parsed.fn).toBe('[Function named]');
    expect(parsed.sym).toBe('Symbol(s)');
    expect(parsed.big).toBe('10n');
  });
});

describe('formatArgs', () => {
  it('joins mixed console arguments into one message', () => {
    const message = formatArgs(['count is', 42, { id: 7 }]);
    expect(message).toContain('count is');
    expect(message).toContain('42');
    expect(message).toContain('"id":7');
  });

  it('formats Errors compactly', () => {
    expect(formatArgs([new TypeError('bad')])).toBe('TypeError: bad');
  });
});
