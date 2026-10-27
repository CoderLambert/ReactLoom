/** Fetch a generated same-origin asset as one bounded, cancellable transaction.
 * A deadline must cover BOTH response headers and the streaming body parser.
 * This prevents a valid 200 response that never finishes streaming from leaving
 * the Library Lab spinner and active network connection alive indefinitely.
 */
/** Reject path reinterpretation by browsers, CDNs or reverse proxies before fetch. */
export function assertGeneratedResourcePath(url) {
  if (typeof url !== 'string' || url.length > 2048 || !url.startsWith('/') ||
      url.startsWith('//') || /[?#\\\u0000-\u001f\u007f]/u.test(url)) {
    throw new TypeError('Generated resource must use a canonical same-origin pathname');
  }
  const segments = url.slice(1).split('/');
  if (segments.length > 32 || segments.some(segment => !segment)) {
    throw new TypeError('Generated resource path contains empty or excessive segments');
  }
  for (const segment of segments) {
    let decoded;
    try { decoded = decodeURIComponent(segment); }
    catch { throw new TypeError('Generated resource path contains malformed percent encoding'); }
    // Deny nested escapes as well: a second proxy decode must not produce "../" or "/".
    if (decoded === '.' || decoded === '..' ||
        /[/\\\u0000-\u001f\u007f]/u.test(decoded) || /%[0-9a-f]{2}/iu.test(decoded)) {
      throw new TypeError('Generated resource path contains unsafe encoded segments');
    }
  }
  return url;
}

export async function requestGeneratedResource(url, parse, {signal, timeoutMs = 20_000, fetchImpl = fetch} = {}) {
  assertGeneratedResourcePath(url);
  if (typeof parse !== 'function' || typeof fetchImpl !== 'function') {
    throw new TypeError('Generated resource requires a parser and fetch implementation');
  }
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120_000) {
    throw new RangeError('Generated resource timeout is invalid');
  }
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort(signal?.reason ?? new DOMException('Cancelled', 'AbortError'));
  if (signal?.aborted) abortFromCaller();
  else signal?.addEventListener('abort', abortFromCaller, {once:true});
  const timeout = setTimeout(() => controller.abort(new Error('生成资源读取超时，请重试')), timeoutMs);
  try {
    if (controller.signal.aborted) throw controller.signal.reason;
    // no-store avoids retrying a stale SPA/CDN cache entry after a digest mismatch.
    const response = await fetchImpl(url, {signal:controller.signal, cache:'no-store'});
    if (controller.signal.aborted) throw controller.signal.reason;
    const value = await parse(response);
    if (controller.signal.aborted) throw controller.signal.reason;
    return value;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abortFromCaller);
    controller.abort();
  }
}
