// Domain safety checks shared by the Cropper UI and Node policy tests.
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 16_000_000;
export const MAX_OUTPUT_PIXELS = 4_000_000;
const MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

export function checkImageFile(file) {
  if (!file || !MIME_TYPES.has(file.type) || !Number.isSafeInteger(file.size) || file.size < 1 || file.size > MAX_IMAGE_BYTES) {
    throw new Error('仅支持非空且不超过4MiB的PNG/JPEG/WebP文件');
  }
  return file;
}

export function checkImageDimensions(width, height) {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1 || width * height > MAX_IMAGE_PIXELS) {
    throw new Error('图片像素尺寸无效或超过1600万');
  }
  return { width, height };
}

export function checkCropArea(area, imageWidth, imageHeight) {
  checkImageDimensions(imageWidth, imageHeight);
  if (!area || ![area.x, area.y, area.width, area.height].every(Number.isSafeInteger) ||
      area.x < 0 || area.y < 0 || area.width < 1 || area.height < 1 ||
      area.x + area.width > imageWidth || area.y + area.height > imageHeight) {
    throw new Error('裁剪区域超出源图或坐标无效');
  }
  if (area.width * area.height > MAX_OUTPUT_PIXELS) {
    throw new Error('裁剪输出超过400万像素，请继续放大后重试');
  }
  return { x: area.x, y: area.y, width: area.width, height: area.height };
}
