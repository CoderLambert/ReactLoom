/** Fetch a generated same-origin asset as one bounded, cancellable transaction.
 * A deadline must cover BOTH response headers and the streaming body parser.
 * This prevents a valid 200 response that never finishes streaming from leaving
 * the Library Lab spinner and active network connection alive indefinitely.
 */
export async function requestGeneratedResource(url, parse, {signal, timeoutMs = 20_000, fetchImpl = fetch} = {}) {
  if (typeof url !== 'string' || !url.startsWith('/') || url.startsWith('//') ||
      /[\\\u0000-\u001f]/u.test(url) || /(?:^|\/)\.\.?\//u.test(url) ||
      typeof parse !== 'function' || typeof fetchImpl !== 'function') {
    throw new TypeError('Generated resource request must use a same-origin pathname and parser');
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
