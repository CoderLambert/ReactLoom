// Claim the inverse synchronously so a deferred React updater never reads a cleared ref.
export function takeUndo(ref) {
  const patches = ref.current;
  if (patches === null) return null;
  ref.current = null;
  return patches;
}
