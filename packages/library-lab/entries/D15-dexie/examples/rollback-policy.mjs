// Compare all business fields by stable ID; row count alone cannot prove rollback.
export function sameFeedSnapshot(before, after) {
  if (!Array.isArray(before) || !Array.isArray(after) || before.length !== after.length) return false;
  const byId = (a, b) => a.id.localeCompare(b.id);
  const left = [...before].sort(byId);
  const right = [...after].sort(byId);
  return left.every((row, index) => {
    const next = right[index];
    return next !== undefined && row.id === next.id && row.group === next.group &&
      row.updatedAt === next.updatedAt && row.read === next.read;
  });
}
