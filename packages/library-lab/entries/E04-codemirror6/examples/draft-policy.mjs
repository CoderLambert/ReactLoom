// CodeMirror edits plain text; the bound protects session restore, not TypeScript execution.
export const MAX_DRAFT = 50_000;
export function assertDraftText(value) {
  if (typeof value !== 'string' || value.length > MAX_DRAFT || value.includes('\0')) {
    throw new Error('草稿超出 50,000 UTF-16 字符限制或包含 NUL');
  }
  return value;
}
