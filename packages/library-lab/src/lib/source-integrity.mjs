import {safeRelativePath} from './catalog.mjs';

// Match the generator's per-source lstat limit. Stream-check decoded payload
// bytes: Content-Length can describe a compressed response or be absent.
export const MAX_SOURCE_BYTES = 2_000_000;
const SHA256 = /^[a-f0-9]{64}$/u;

/** Preserve the displayed filename, but serve all source as inert text. */
export function sourceTextPath(relative) {
  if (!safeRelativePath(relative)) throw new Error('Unsafe source transport path');
  return `${relative}.txt`;
}

/** Fail closed on stale/incomplete source indexes rather than displaying a
 * different version or silently omitting declared source files. */
export function validateSourceIndex(value, requestedPaths) {
  if (!Array.isArray(value) || value.length > 256 || !Array.isArray(requestedPaths) ||
      requestedPaths.length > 256 || requestedPaths.some(path => !safeRelativePath(path))) {
    throw new Error('源码索引或声明的文件列表格式错误');
  }
  const entries = new Map();
  for (const file of value) {
    if (!file || typeof file !== 'object' || Array.isArray(file) ||
        !safeRelativePath(file.path) || !SHA256.test(file.sha256 ?? '') ||
        !Number.isSafeInteger(file.bytes) || file.bytes < 0 || file.bytes > MAX_SOURCE_BYTES ||
        entries.has(file.path)) {
      throw new Error('源码索引含无效路径、大小、摘要或重复文件');
    }
    entries.set(file.path, {path:file.path, sha256:file.sha256, bytes:file.bytes});
  }
  return [...new Set(requestedPaths)].map(path => {
    const file = entries.get(path);
    if (!file) throw new Error(`源码索引缺少声明文件：${path}`);
    return file;
  });
}

/** Read no more than the hash-indexed byte count. Never use Response.text()
 * for a potentially unbounded source response, even on a same-origin preview. */
export async function readBoundedSourceResponse(response, expectedBytes) {
  if (!response?.ok || typeof response.headers?.get !== 'function' ||
      response.headers.get('content-type')?.toLowerCase().includes('text/html')) {
    throw new Error('源码读取失败，或服务器返回了 SPA 页面');
  }
  if (!Number.isSafeInteger(expectedBytes) || expectedBytes < 0 || expectedBytes > MAX_SOURCE_BYTES) {
    throw new Error('源码索引声明了非法文件大小');
  }
  if (!response.body) {
    if (expectedBytes === 0) return '';
    throw new Error('源码响应为空');
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8', {fatal:true});
  const chunks = [];
  let received = 0;
  try {
    for (;;) {
      const {value, done} = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array)) throw new Error('源码响应不是字节流');
      received += value.byteLength;
      if (received > expectedBytes || received > MAX_SOURCE_BYTES) {
        throw new Error('源码实际大小超出索引声明或平台上限');
      }
      chunks.push(decoder.decode(value, {stream:true}));
    }
    chunks.push(decoder.decode());
    if (received !== expectedBytes) throw new Error('源码字节数与索引声明不一致');
    return chunks.join('');
  } catch (error) {
    try {await reader.cancel();} catch { /* already closed or aborted */ }
    throw error;
  } finally {
    reader.releaseLock();
  }
}

/** A detail snapshot pins the complete generated source index. Per-file SHA alone
 * cannot detect a stale or substituted index where both bytes and SHA changed.
 * Normalize known keys so JSON property order/whitespace is not significant. */
export async function verifySourceIndexDigest(value, expectedSha256) {
  if (!SHA256.test(expectedSha256 ?? '')) throw new Error('库详情未提供有效的源码索引摘要');
  if (!Array.isArray(value) || value.length > 256) throw new Error('源码索引格式错误');
  if (!globalThis.crypto?.subtle) throw new Error('当前环境无法校验源码索引 SHA-256');
  const bytes = new TextEncoder().encode(JSON.stringify(value.map(file=>({path:file.path,sha256:file.sha256,bytes:file.bytes}))));
  if (bytes.byteLength > 128_000) throw new Error('源码索引校验超出字节预算');
  const digest = await globalThis.crypto.subtle.digest('SHA-256',bytes);
  const actual = Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  if (actual !== expectedSha256) throw new Error('源码索引与当前库详情版本不匹配，请刷新后重试');
  return value;
}
