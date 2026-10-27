/** Fast local preflight. Signatures cannot make an untrusted decoder memory-safe. */
export const MAX_INPUT_BYTES = 4 * 1024 * 1024;
export const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
const MIME_EXTENSION = Object.freeze({
  'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/mpeg': 'mp3',
  'audio/webm': 'webm', 'video/webm': 'webm', 'video/mp4': 'mp4',
});
const ascii = (bytes, start, length) =>
  String.fromCharCode(...bytes.subarray(start, start + length));
const isWav = (bytes) =>
  bytes.length >= 12 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WAVE';
const isWebm = (bytes) =>
  bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
const isMp4 = (bytes) => bytes.length >= 12 && ascii(bytes, 4, 4) === 'ftyp';
const isMp3 = (bytes) =>
  bytes.length >= 3 && (ascii(bytes, 0, 3) === 'ID3' ||
    (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);

export function isAllowedMediaFile(file) {
  return Boolean(MIME_EXTENSION[file?.type] &&
    Number.isSafeInteger(file?.size) && file.size >= 1 && file.size <= MAX_INPUT_BYTES);
}
export function validateInputMedia(file, bytes) {
  if (!isAllowedMediaFile(file) || !(bytes instanceof Uint8Array) ||
      bytes.byteLength !== file.size) {
    throw new Error('仅接受4MiB以内且大小一致的WAV、MP3、WebM或MP4文件');
  }
  const extension = MIME_EXTENSION[file.type];
  const matches = extension === 'wav' ? isWav(bytes) : extension === 'mp3'
    ? isMp3(bytes) : extension === 'webm' ? isWebm(bytes) : isMp4(bytes);
  if (!matches) throw new Error('文件头与声明的媒体格式不一致');
  return extension;
}
export function validateOutputWav(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength < 44 ||
      bytes.byteLength > MAX_OUTPUT_BYTES || !isWav(bytes)) {
    throw new Error('转换结果不是有效大小的WAV文件');
  }
  return bytes.byteLength;
}
