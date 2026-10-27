/** Serialize a bounded local tldraw document before creating any Object URL. */
export const MAX_SNAPSHOT_BYTES = 3_000_000;
export function serializeSnapshot(value: unknown): string {
  const json = JSON.stringify(value, null, 2);
  if (typeof json !== 'string') throw new Error('没有可导出的 JSON 文档');
  if (new TextEncoder().encode(json).byteLength > MAX_SNAPSHOT_BYTES)
    throw new Error('快照超过 3 MB，请减少当前页面形状后重试');
  return json;
}
