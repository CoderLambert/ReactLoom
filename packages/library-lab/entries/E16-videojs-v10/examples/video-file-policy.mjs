/** MIME is only a hint; validate the first 32 bytes before creating a playable URL. */
export const MAX_VIDEO_BYTES = 8 * 1024 * 1024;
export function validateVideoMetadata(file) {
  if (!file || !['video/mp4','video/webm'].includes(file.type) ||
      !Number.isSafeInteger(file.size) || file.size < 12 || file.size > MAX_VIDEO_BYTES ||
      typeof file.slice !== 'function') {
    throw new Error('仅接受12字节至8MiB的本地MP4/WebM');
  }
  return file.type;
}
export function validateVideoHeader(type, data) {
  if (!(data instanceof Uint8Array) || data.byteLength < 12) {
    throw new Error('视频文件头不足');
  }
  const mp4 = String.fromCharCode(...data.subarray(4,8)) === 'ftyp';
  const webm = data[0] === 0x1a && data[1] === 0x45 && data[2] === 0xdf && data[3] === 0xa3;
  if (type === 'video/mp4' ? !mp4 : type === 'video/webm' ? !webm : true) {
    throw new Error('媒体声明类型与文件头不匹配');
  }
}
