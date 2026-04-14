/**
 * Recursively walk any JSON-like object/array and collect or transform
 * string values that match a predicate. Returns a new object (does not mutate).
 */
export type UrlTransformer = (url: string, path: string) => string | undefined;

export function walkAndCollect(
  obj: unknown,
  match: (s: string) => boolean,
  path = ''
): Array<{ url: string; path: string }> {
  const out: Array<{ url: string; path: string }> = [];
  if (typeof obj === 'string') {
    if (match(obj)) out.push({ url: obj, path });
    return out;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => out.push(...walkAndCollect(v, match, `${path}[${i}]`)));
    return out;
  }
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out.push(...walkAndCollect(v, match, path ? `${path}.${k}` : k));
    }
  }
  return out;
}

export function walkAndTransform<T>(obj: T, transform: UrlTransformer, path = ''): T {
  if (typeof obj === 'string') {
    const next = transform(obj, path);
    return (next ?? obj) as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((v, i) => walkAndTransform(v, transform, `${path}[${i}]`)) as unknown as T;
  }
  if (obj && typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[k] = walkAndTransform(v, transform, path ? `${path}.${k}` : k);
    }
    return out as T;
  }
  return obj;
}

/** Default matcher: HTTP(S) URL ending in one of the extensions (ignoring query). */
export function makeExtensionMatcher(extensions: string[]): (s: string) => boolean {
  const pattern = new RegExp(`^https?://[^\\s"]+\\.(${extensions.join('|')})(\\?.*)?$`, 'i');
  return (s) => pattern.test(s);
}
