/** Strict local-vs-central ZIP header reconciliation before invoking SheetJS.
 * Intended for a narrow three-column XLSX fixture, not a general ZIP reader.
 */
export function verifyLocalZipEntry(bytes, {centralOffset, localOffset, directoryStart, nameBytes, flags, method, compressed, uncompressed}) {
  const fail = (reason) => { throw new Error('拒绝 XLSX ZIP：' + reason); };
  if (!(bytes instanceof Uint8Array) || !(nameBytes instanceof Uint8Array)) fail('非法ZIP输入');
  if ((flags & ~0x0800) !== 0) fail('不支持的ZIP标志位或数据描述符');
  if (!Number.isSafeInteger(localOffset) || localOffset < 0 || localOffset + 30 > directoryStart) fail('本地头范围非法');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const u16 = (at) => view.getUint16(at, true), u32 = (at) => view.getUint32(at, true);
  if (u32(localOffset) !== 0x04034b50) fail('本地头签名异常');
  if (u16(localOffset + 6) !== flags || u16(localOffset + 8) !== method ||
      u32(localOffset + 14) !== u32(centralOffset + 16) ||
      u32(localOffset + 18) !== compressed || u32(localOffset + 22) !== uncompressed) {
    fail('本地头与中央目录元数据不一致');
  }
  const nameLength = u16(localOffset + 26), extraLength = u16(localOffset + 28);
  const dataStart = localOffset + 30 + nameLength + extraLength;
  if (nameLength !== nameBytes.length || dataStart + compressed > directoryStart) fail('本地文件范围非法');
  if (bytes.subarray(localOffset + 30, localOffset + 30 + nameLength)
    .some((byte, index) => byte !== nameBytes[index])) fail('本地文件名与中央目录不一致');
  return [localOffset, dataStart + compressed]; // Includes header to catch header/data overlap.
}
