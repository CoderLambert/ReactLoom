import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectPcmWav} from './wav-output-policy.mjs';
function tone(samples = 16000) {
  const b = new Uint8Array(44 + samples * 2), v = new DataView(b.buffer);
  const four = (offset, value) => b.set(Buffer.from(value), offset);
  four(0, 'RIFF'); v.setUint32(4, b.length - 8, true); four(8, 'WAVE');
  four(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
  v.setUint16(22, 1, true); v.setUint32(24, 16000, true);
  v.setUint32(28, 32000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  four(36, 'data'); v.setUint32(40, samples * 2, true);
  return b;
}
test('valid PCM16 mono 16k WAV has bounded duration', () => {
  assert.deepEqual(inspectPcmWav(tone()), {bytes: 32044, sampleRate: 16000, channels: 1, seconds: 1});
});
test('malformed RIFF length, inflated chunks and truncated data fail', () => {
  const a = tone(); a[4] = 0; assert.throws(() => inspectPcmWav(a), /RIFF/);
  const b = tone(); new DataView(b.buffer).setUint32(40, 0xffffffff, true);
  assert.throws(() => inspectPcmWav(b), /chunk越界/);
  const c = tone().subarray(0, 32043); assert.throws(() => inspectPcmWav(c), /RIFF/);
});
test('rejects codec, channel, sample-rate and byte-rate mismatches', () => {
  for (const [offset, value, wide] of [[20,3,false],[22,2,false],[24,44100,true],[28,64000,true]]) {
    const b=tone(), v=new DataView(b.buffer);
    wide ? v.setUint32(offset,value,true) : v.setUint16(offset,value,true);
    assert.throws(() => inspectPcmWav(b), /PCM16/);
  }
});
test('rejects empty data, extra length and durations beyond two seconds', () => {
  const empty=tone(); new DataView(empty.buffer).setUint32(40,0,true);
  assert.throws(() => inspectPcmWav(empty), /预算/);
  assert.throws(() => inspectPcmWav(tone(40000)), /预算/);
  assert.throws(() => inspectPcmWav(tone(), 32), /预算/);
});
test('accepts valid ancillary chunks and validates padding', () => {
  const original=tone(8000), out=new Uint8Array(original.length+10);
  out.set(original.subarray(0,36)); out.set(Buffer.from('JUNK'),36);
  const v=new DataView(out.buffer);v.setUint32(40,2,true);out[44]=7;out[45]=8;
  out.set(original.subarray(36),46);v.setUint32(4,out.length-8,true);
  assert.equal(inspectPcmWav(out).seconds,0.5);
});
