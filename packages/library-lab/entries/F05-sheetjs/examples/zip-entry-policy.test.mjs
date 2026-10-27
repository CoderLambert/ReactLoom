import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyLocalZipEntry} from './zip-entry-policy.mjs';
function makeEntry(flags = 0) {
  const name = new TextEncoder().encode('xl/workbook.xml');
  const bytes = new Uint8Array(160);
  const view = new DataView(bytes.buffer);
  const localOffset = 0, centralOffset = 50, directoryStart = 130, compressed = 3, uncompressed = 3, method = 0;
  const u16 = (at, value) => view.setUint16(at, value, true);
  const u32 = (at, value) => view.setUint32(at, value, true);
  u32(0, 0x04034b50); u16(6, flags); u16(8, method); u32(14, 123); u32(18, 3); u32(22, 3); u16(26, name.length);
  bytes.set(name, 30); bytes.set([1,2,3], 30+name.length);
  u32(centralOffset+16, 123);
  return {bytes, args:{centralOffset,localOffset,directoryStart,nameBytes:name,flags,method,compressed,uncompressed},view};
}
test('accepts matching local and central headers; returns header-inclusive bounds', () => {
  const {bytes,args} = makeEntry();
  assert.deepEqual(verifyLocalZipEntry(bytes,args), [0, 33+args.nameBytes.length]);
});
test('rejects the data descriptor flag even when both records agree', () => {
  const {bytes,args} = makeEntry(0x8);
  assert.throws(() => verifyLocalZipEntry(bytes,args), /数据描述符/);
});
test('rejects local flag, compressed length, original length or CRC mismatches', () => {
  for (const [offset, value, kind] of [[6,1,'u16'],[18,4,'u32'],[22,4,'u32'],[14,900,'u32']]) {
    const {bytes,args,view} = makeEntry();
    if (kind === 'u16') view.setUint16(offset,value,true);
    else view.setUint32(offset,value,true);
    assert.throws(() => verifyLocalZipEntry(bytes,args), /不一致/);
  }
});
test('rejects local filenames that do not match central names', () => {
  const {bytes,args} = makeEntry(); bytes[30] = 65;
  assert.throws(() => verifyLocalZipEntry(bytes,args), /文件名/);
});
test('rejects invalid local bounds and offsets before reading beyond the DataView', () => {
  const {bytes,args} = makeEntry();
  assert.throws(() => verifyLocalZipEntry(bytes,{...args,localOffset:110}), /范围/);
  assert.throws(() => verifyLocalZipEntry(bytes,{...args,localOffset:-1}), /范围/);
});
