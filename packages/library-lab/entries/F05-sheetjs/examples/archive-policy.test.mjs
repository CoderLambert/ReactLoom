import test from 'node:test';
import assert from 'node:assert/strict';
import {preflightXlsx, ARCHIVE_LIMITS} from './archive-policy.mjs';
function archive(entries) {
  const local = [], central = [];
  let position = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name), bytes = Buffer.from(entry.content ?? 'x');
    const l = Buffer.alloc(30 + name.length + bytes.length);
    l.writeUInt32LE(0x04034b50, 0);
    l.writeUInt16LE(entry.flags ?? 0, 6);
    l.writeUInt16LE(entry.method ?? 0, 8);
    l.writeUInt32LE(bytes.length, 18);
    l.writeUInt32LE(entry.inflated ?? bytes.length, 22);
    l.writeUInt16LE(name.length, 26);
    name.copy(l, 30);
    bytes.copy(l, 30 + name.length);
    local.push(l);
    const c = Buffer.alloc(46 + name.length);
    c.writeUInt32LE(0x02014b50, 0);
    c.writeUInt16LE(entry.flags ?? 0, 8);
    c.writeUInt16LE(entry.method ?? 0, 10);
    c.writeUInt32LE(bytes.length, 20);
    c.writeUInt32LE(entry.inflated ?? bytes.length, 24);
    c.writeUInt16LE(name.length, 28);
    c.writeUInt32LE(position, 42);
    name.copy(c, 46);
    central.push(c);
    position += l.length;
  }
  const cdSize = central.reduce((n, v) => n + v.length, 0), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cdSize, 12);
  end.writeUInt32LE(position, 16);
  return Buffer.concat([...local, ...central, end]);
}
const normal = () => archive([
  {name: '[Content_Types].xml'}, {name: 'xl/workbook.xml'},
  {name: 'xl/worksheets/sheet1.xml'},
]);
test('accepts a small bounded ZIP containing the workbook parts', () => {
  const result = preflightXlsx(normal());
  assert.equal(result.files, 3);
  assert.equal(result.declaredInflatedBytes, 3);
});
test('rejects damaged central directories', () => {
  assert.throws(() => preflightXlsx(new Uint8Array(200)), /ZIP/);
  assert.throws(() => preflightXlsx(normal().subarray(0, normal().length - 2)), /ZIP/);
});
test('rejects traversal, duplicate names, encryption and macro entries', () => {
  const required = [{name: '[Content_Types].xml'}, {name: 'xl/workbook.xml'}];
  for (const invalid of [
    {name: '../evil'}, {name: 'xl/workbook.xml'},
    {name: 'xl/vbaProject.bin'}, {name: 'xl/secret', flags: 1},
  ]) {
    assert.throws(() => preflightXlsx(archive([...required, invalid])), /ZIP/);
  }
});
test('rejects declared inflation bombs before invoking XLSX.read', () => {
  const bytes = archive([
    {name: '[Content_Types].xml'}, {name: 'xl/workbook.xml'},
    {name: 'xl/huge', method: 8, inflated: ARCHIVE_LIMITS.maxEntryBytes + 1},
  ]);
  assert.throws(() => preflightXlsx(bytes), /解压预算/);
});
test('rejects mismatched local flags and declared sizes before XLSX.read', () => {
  for (const [position, size, writeMethod] of [[6, 1, 'writeUInt16LE'], [18, 999, 'writeUInt32LE'], [22, 999, 'writeUInt32LE']]) {
    const altered = normal();
    altered[writeMethod](size, position);
    assert.throws(() => preflightXlsx(altered), /ZIP/);
  }
});
test('rejects local data descriptors even if central and local bits agree', () => {
  assert.throws(() => preflightXlsx(archive([
    {name:'[Content_Types].xml'}, {name:'xl/workbook.xml',flags:0x8},
  ])), /数据描述符/);
});
