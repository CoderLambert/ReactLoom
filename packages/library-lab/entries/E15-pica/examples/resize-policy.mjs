// Browser-independent image limits; the SDK still performs the actual resize.
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 16_000_000;
const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp']);
const ALLOWED_LONG_EDGES = new Set([240, 480, 800]);

export function checkSourceFile(file) {
  if (!file || !ALLOWED_MIME.has(file.type) || !Number.isSafeInteger(file.size) || file.size < 1 || file.size > MAX_IMAGE_BYTES) {
    throw new Error('只接受非空且4MiB以内的PNG/JPEG/WebP');
  }
  return file;
}

export function checkSourcePixels(width, height) {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1 || width * height > MAX_IMAGE_PIXELS) {
    throw new Error('解码图像像素无效或超过1600万');
  }
}

export function targetDimensions(width, height, longEdge) {
  checkSourcePixels(width, height);
  if (!ALLOWED_LONG_EDGES.has(longEdge)) throw new Error('不支持的输出最长边');
  const scale = Math.min(1, longEdge / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}
