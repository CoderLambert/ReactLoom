/** A bounded, fail-closed JSON fetch boundary for generated public catalogue data.
 * Response.json() does not limit decompressed bytes or reject SPA fallbacks.
 * Structural and fingerprint validation still runs after this transport check. */
export const JSON_RESPONSE_LIMITS = Object.freeze({
  catalogIndex: 512_000,
  catalogDetail: 512_000,
  sourceIndex: 128_000,
});

export async function readLimitedJsonResponse(response, maxBytes) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 2_000_000) {
    throw new RangeError('JSON response byte budget is invalid');
  }
  if (!response?.ok || typeof response.headers?.get !== 'function') {
    throw new Error('JSON 资源读取失败');
  }
  const mime = (response.headers.get('content-type') ?? '').split(';', 1)[0].trim().toLowerCase();
  if (mime !== 'application/json' && !/^application\/[a-z0-9.+-]+\+json$/u.test(mime)) {
    throw new Error('JSON 资源类型不正确，可能返回了 SPA 页面');
  }
  if (!response.body) throw new Error('JSON 响应没有可读取的字节流');
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8', {fatal:true});
  const chunks = [];
  let bytes = 0;
  try {
    for (;;) {
      const {value, done} = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array)) throw new Error('JSON 响应不是字节流');
      bytes += value.byteLength;
      if (bytes > maxBytes) throw new Error('JSON 响应超过字节安全上限');
      chunks.push(decoder.decode(value, {stream:true}));
    }
    chunks.push(decoder.decode());
    return JSON.parse(chunks.join(''));
  } catch (error) {
    try { await reader.cancel(); } catch { /* aborted or already closed */ }
    throw error;
  } finally {
    reader.releaseLock();
  }
}
