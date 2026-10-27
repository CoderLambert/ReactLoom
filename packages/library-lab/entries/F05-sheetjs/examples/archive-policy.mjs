/** Bounded ZIP-directory preflight. Never a replacement for an isolated parser with hard CPU/memory limits. */
export const ARCHIVE_LIMITS = Object.freeze({
  maxBytes: 2_000_000, maxFiles: 80, maxEntryBytes: 4_000_000,
  maxInflatedBytes: 8_000_000, maxRatio: 200,
});
const EOCD = 0x06054b50, CENTRAL = 0x02014b50, LOCAL = 0x04034b50;
const fail = (why) => { throw new Error('拒绝 XLSX ZIP：' + why); };

export function preflightXlsx(bytes) {
  if (!(bytes instanceof Uint8Array) || !bytes.length ||
      bytes.length > ARCHIVE_LIMITS.maxBytes) fail('输入不得超过2MiB');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const len = bytes.byteLength;
  const u16 = (at) => view.getUint16(at, true);
  const u32 = (at) => view.getUint32(at, true);
  let eocd = -1;
  for (let i = len - 22; i >= Math.max(0, len - 22 - 65535); i--) {
    if (u32(i) === EOCD && i + 22 + u16(i + 20) === len) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) fail('未找到合法 ZIP 目录结束标记');
  const count = u16(eocd + 10);
  const directoryBytes = u32(eocd + 12);
  const directoryStart = u32(eocd + 16);
  if (u16(eocd + 4) || u16(eocd + 6) || u16(eocd + 8) !== count ||
      count < 1 || count > ARCHIVE_LIMITS.maxFiles || count === 0xffff ||
      directoryStart === 0xffffffff || directoryBytes === 0xffffffff ||
      directoryStart + directoryBytes !== eocd) {
    fail('多磁盘、ZIP64、条目数或目录范围异常');
  }
  const seen = new Set(), slices = [];
  let inflated = 0, offset = directoryStart;
  const decoder = new TextDecoder('utf-8', {fatal: true});
  for (let i = 0; i < count; i++) {
    if (offset + 46 > eocd || u32(offset) !== CENTRAL) fail('ZIP 目录条目损坏');
    const flags = u16(offset + 8), method = u16(offset + 10);
    const compressed = u32(offset + 20), uncompressed = u32(offset + 24);
    const nameLen = u16(offset + 28), extraLen = u16(offset + 30);
    const commentLen = u16(offset + 32), disk = u16(offset + 34);
    const localOffset = u32(offset + 42);
    const end = offset + 46 + nameLen + extraLen + commentLen;
    if (end > eocd || !nameLen || disk || (flags & 1) ||
        ![0, 8].includes(method) || compressed === 0xffffffff ||
        uncompressed === 0xffffffff || uncompressed > ARCHIVE_LIMITS.maxEntryBytes ||
        (compressed === 0 && uncompressed > 0) ||
        (compressed > 0 && uncompressed / compressed > ARCHIVE_LIMITS.maxRatio) ||
        (method === 0 && compressed !== uncompressed)) {
      fail('压缩方法、加密或条目解压预算异常');
    }
    const nameBytes = bytes.subarray(offset + 46, offset + 46 + nameLen);
    const name = decoder.decode(nameBytes);
    if (/^[\\/]/u.test(name) || name.includes('\\') ||
        name.includes('\u0000') || name.split('/').some(p => p === '.' || p === '..') ||
        seen.has(name)) {
      fail('重复或危险 ZIP 路径');
    }
    if (/^xl\/(vbaProject|activeX|embeddings)\//iu.test(name) ||
        /^xl\/vbaProject\.bin$/iu.test(name)) fail('拒绝活动内容或嵌入二进制');
    seen.add(name);
    inflated += uncompressed;
    if (inflated > ARCHIVE_LIMITS.maxInflatedBytes) fail('总解压体积超过8MiB');
    if (localOffset + 30 > directoryStart || u32(localOffset) !== LOCAL) {
      fail('ZIP 本地条目不存在');
    }
    if (u16(localOffset + 8) !== method) fail('ZIP 压缩方法矛盾');
    const localNameLen = u16(localOffset + 26);
    const localExtraLen = u16(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLen + localExtraLen;
    if (localNameLen !== nameLen || dataStart + compressed > directoryStart) {
      fail('ZIP 文件边界异常');
    }
    if (bytes.subarray(localOffset + 30, localOffset + 30 + nameLen)
      .some((b, j) => b !== nameBytes[j])) fail('ZIP 本地和中央文件名不一致');
    slices.push([dataStart, dataStart + compressed]);
    offset = end;
  }
  if (offset !== eocd) fail('中央目录包含隐藏数据');
  slices.sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < slices.length; i++) {
    if (slices[i][0] < slices[i - 1][1]) fail('ZIP 文件内容互相重叠');
  }
  if (!seen.has('[Content_Types].xml') || !seen.has('xl/workbook.xml')) {
    fail('缺少 XLSX 必需文件');
  }
  return Object.freeze({
    files: count, compressedBytes: len, declaredInflatedBytes: inflated,
  });
}
