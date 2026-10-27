import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isAllowedMediaFile, validateInputMedia, validateOutputWav,
  MAX_INPUT_BYTES, MAX_OUTPUT_BYTES,
} from './input-policy.mjs';
const wav = () => {
  const bytes = new Uint8Array(46), view = new DataView(bytes.buffer);
  const label = (offset, name) => bytes.set(Buffer.from(name), offset);
  label(0,'RIFF'); view.setUint32(4,bytes.length-8,true); label(8,'WAVE');
  label(12,'fmt '); view.setUint32(16,16,true); view.setUint16(20,1,true);
  view.setUint16(22,1,true); view.setUint32(24,16000,true);
  view.setUint32(28,32000,true); view.setUint16(32,2,true); view.setUint16(34,16,true);
  label(36,'data'); view.setUint32(40,2,true);
  return bytes;
};
test('WAV signature accepted but MIME spoof rejected', () => {
  assert.equal(validateInputMedia({type: 'audio/wav', size: 46}, wav()), 'wav');
  assert.throws(() => validateInputMedia({type: 'audio/mpeg', size: 46}, wav()), /文件头/);
});
test('size limits run before reading oversized media into WASM', () => {
  assert.equal(isAllowedMediaFile({type: 'audio/wav', size: MAX_INPUT_BYTES + 1}), false);
  assert.throws(() => validateInputMedia({type: 'audio/wav', size: 43}, wav()), /大小一致/);
  assert.equal(validateOutputWav(wav()), 46);
  assert.throws(() => validateOutputWav(new Uint8Array(MAX_OUTPUT_BYTES + 1)), /预算/);
});
test('supports known MP3/WebM/MP4 signatures, rejects mismatches', () => {
  const mp3 = Uint8Array.from([0x49, 0x44, 0x33, 0, 0]);
  assert.equal(validateInputMedia({type: 'audio/mpeg', size: 5}, mp3), 'mp3');
  const webm = Uint8Array.from([0x1a, 0x45, 0xdf, 0xa3]);
  assert.equal(validateInputMedia({type: 'video/webm', size: 4}, webm), 'webm');
  const mp4 = new Uint8Array(12);
  mp4.set(Buffer.from('ftyp'), 4);
  assert.equal(validateInputMedia({type: 'video/mp4', size: 12}, mp4), 'mp4');
  assert.throws(() => validateInputMedia({type: 'video/mp4', size: 4}, webm), /文件头/);
});
