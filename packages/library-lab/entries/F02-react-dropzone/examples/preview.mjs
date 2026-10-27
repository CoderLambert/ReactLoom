// Bound decoded file input to the minimum amount needed for a preview.
export const PREVIEW_BYTES = 8 * 1024;
export const PREVIEW_CHARACTERS = 1600;
export async function readLocalTextPreview(file) {
  if (!file || typeof file.slice !== 'function' ||
      !Number.isSafeInteger(file.size) || file.size < 0) {
    throw new TypeError('A valid local Blob/File is required');
  }
  return (await file.slice(0, PREVIEW_BYTES).text()).slice(0, PREVIEW_CHARACTERS);
}
