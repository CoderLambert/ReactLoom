import test from 'node:test';
import assert from 'node:assert/strict';
import {MAX_VIDEO_BYTES, validateVideoHeader, validateVideoMetadata} from './video-file-policy.mjs';
const mock = (type,size=100) => ({type,size,slice(){}});
test('accepts bounded local video metadata, rejects zero, oversized and unknown MIME',()=>{
  assert.equal(validateVideoMetadata(mock('video/webm')), 'video/webm');
  assert.throws(()=>validateVideoMetadata(mock('video/mp4',0)),/本地/);
  assert.throws(()=>validateVideoMetadata(mock('video/mp4',MAX_VIDEO_BYTES+1)),/本地/);
  assert.throws(()=>validateVideoMetadata(mock('application/octet-stream')), /本地/);
});
test('checks ISO BMFF ftyp and EBML header without decoding media',()=>{
  const mp4=new Uint8Array(32);mp4.set(Buffer.from('ftyp'),4);
  const webm=new Uint8Array(32);webm.set([0x1a,0x45,0xdf,0xa3],0);
  assert.doesNotThrow(()=>validateVideoHeader('video/mp4',mp4));
  assert.doesNotThrow(()=>validateVideoHeader('video/webm',webm));
  assert.throws(()=>validateVideoHeader('video/mp4',webm),/不匹配/);
  assert.throws(()=>validateVideoHeader('video/webm',mp4),/不匹配/);
});
test('rejects bogus byte types, tiny file and unsupported video MIME',()=>{
  assert.throws(()=>validateVideoHeader('video/mp4',new Uint8Array(3)),/不足/);
  assert.throws(()=>validateVideoHeader('video/mp4','ftyp'),/不足/);
  assert.throws(()=>validateVideoHeader('video/x-msvideo',new Uint8Array(32)),/不匹配/);
});
