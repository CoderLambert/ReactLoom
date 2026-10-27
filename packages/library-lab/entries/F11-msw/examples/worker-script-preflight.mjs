/** Browser-only SW script preflight. Not proof that MSW itself started or intercepted a frame. */
export const MAX_WORKER_SCRIPT_BYTES = 512 * 1024;
const MIME = /^(?:text|application)\/javascript$/iu;

export function assertScopedWorkerScriptUrl(scopeHref, scriptHref) {
  const scope = new URL(scopeHref);
  const script = new URL(scriptHref);
  if (!['http:', 'https:'].includes(scope.protocol) || scope.username || scope.password ||
      scope.search || scope.hash || !scope.pathname.endsWith('/lab-runners/msw/') ||
      script.href !== new URL('mockServiceWorker.js', scope).href ||
      script.origin !== scope.origin) {
    throw new Error('MSW worker script must be the exact same-origin scoped asset');
  }
  return script.href;
}

export async function preflightScopedWorkerScript(scopeHref, scriptHref, fetchImpl = globalThis.fetch) {
  const expected = assertScopedWorkerScriptUrl(scopeHref, scriptHref);
  if (typeof fetchImpl !== 'function') throw new TypeError('Browser fetch is required');
  const response = await fetchImpl(expected, {
    mode: 'same-origin', credentials: 'same-origin', redirect: 'error', cache: 'no-store',
  });
  if (response.status !== 200 || response.redirected || response.url !== expected) {
    throw new Error('MSW scoped worker did not return its exact script URL (200)');
  }
  const type = (response.headers?.get('content-type') ?? '').split(';')[0].trim();
  if (!MIME.test(type)) throw new Error('MSW script MIME must be JavaScript, not SPA HTML');
  const reportedLength = response.headers?.get('content-length');
  if (reportedLength !== null && reportedLength !== undefined &&
      (!/^\d+$/u.test(reportedLength) || Number(reportedLength) > MAX_WORKER_SCRIPT_BYTES)) {
    throw new Error('MSW worker script exceeds bounded size');
  }
  const reader = response.body?.getReader?.();
  if (!reader) throw new Error('MSW worker script response must support bounded streaming');
  let size = 0;
  const head = [];
  try {
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array)) throw new Error('Unexpected worker script chunk');
      size += value.byteLength;
      if (size > MAX_WORKER_SCRIPT_BYTES) throw new Error('MSW worker script exceeds bounded size');
      if (head.length < 32) head.push(...value.subarray(0, 32 - head.length));
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  if (size === 0 || /^\s*</u.test(new TextDecoder().decode(new Uint8Array(head)))) {
    throw new Error('MSW worker script is empty or looks like HTML');
  }
  return {url: expected, bytes: size, mime: type};
}
