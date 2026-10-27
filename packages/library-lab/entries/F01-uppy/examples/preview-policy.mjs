/** Local-only bounded UTF-8 preview. Never decodes an unbounded upload. */
export const MAX_PREVIEW_BYTES = 12_000;
export const MAX_DISPLAY_CHARACTERS = 4_000;

export async function readTextPreview(blob) {
  if (!(blob instanceof Blob) || blob.size > MAX_PREVIEW_BYTES) {
    throw new Error('预览仅接受不超过 12KB 的本地 Blob');
  }
  const bytes = await blob.arrayBuffer();
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  if (/[\u0000-\u0008\u000b\u000e-\u001f\u007f]/u.test(text)) {
    throw new Error('文件含二进制或不安全控制字符');
  }
  return text.slice(0, MAX_DISPLAY_CHARACTERS);
}
