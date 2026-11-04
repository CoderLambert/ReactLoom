/** Fail closed on malformed, non-PCM or unexpectedly large transcoder output. */
export function inspectPcmWav(bytes, maxBytes = 2 * 1024 * 1024, maxSeconds = 2) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength < 44 || bytes.byteLength > maxBytes) {
    throw new Error('WAV输出超过预算或字节无效');
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const word = (offset, count) => String.fromCharCode(...bytes.subarray(offset, offset + count));
  if (word(0, 4) !== 'RIFF' || word(8, 4) !== 'WAVE' ||
      view.getUint32(4, true) !== bytes.byteLength - 8) {
    throw new Error('WAV RIFF长度或标识不一致');
  }
  let offset = 12;
  let formatFound = false;
  let dataBytes = -1;
  while (offset + 8 <= bytes.byteLength) {
    const id = word(offset, 4);
    const size = view.getUint32(offset + 4, true);
    const next = offset + 8 + size + (size % 2);
    if (!Number.isSafeInteger(next) || next > bytes.byteLength) {
      throw new Error('WAV chunk越界');
    }
    if (id === 'fmt ') {
      if (formatFound || size < 16 ||
          view.getUint16(offset + 8, true) !== 1 ||
          view.getUint16(offset + 10, true) !== 1 ||
          view.getUint32(offset + 12, true) !== 16000 ||
          view.getUint32(offset + 16, true) !== 32000 ||
          view.getUint16(offset + 20, true) !== 2 ||
          view.getUint16(offset + 22, true) !== 16) {
        throw new Error('只允许16kHz单声道PCM16 WAV');
      }
      formatFound = true;
    } else if (id === 'data') {
      if (dataBytes !== -1 || size === 0 || size % 2 !== 0 || size > 16000 * 2 * maxSeconds) {
        throw new Error('WAV音频数据不符合时长或PCM帧预算');
      }
      dataBytes = size;
    }
    offset = next;
  }
  if (!formatFound || dataBytes < 0 || offset !== bytes.byteLength) {
    throw new Error('WAV缺少PCM格式/音频数据或结尾损坏');
  }
  return Object.freeze({bytes: bytes.byteLength, sampleRate: 16000, channels: 1, seconds: dataBytes / 32000});
}
