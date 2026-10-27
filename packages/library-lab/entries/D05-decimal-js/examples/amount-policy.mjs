// Validate the transport representation before constructing decimal.js values.
export function normalizeAmount(label, input) {
  if (typeof input !== 'string') throw new TypeError(label + ' 必须以十进制字符串传入');
  const value = input.trim();
  if (!/^(?:0|[1-9]\d{0,9})(?:\.\d{1,4})?$/.test(value)) {
    throw new Error(label + ' 必须是非负十进制字符串，最多四位小数');
  }
  return value;
}
export function normalizeQuantity(input) {
  if (typeof input !== 'string' || !/^[1-9]\d{0,3}$/.test(input)) {
    throw new Error('数量必须是 1–9999 的整数');
  }
  return input;
}
