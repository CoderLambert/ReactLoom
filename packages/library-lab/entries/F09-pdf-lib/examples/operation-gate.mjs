/** Synchronous single-flight state for non-cancellable local PDF operations. */
export function createOperationGate() {
  let sequence = 0;
  let active = null;
  return {
    begin() {
      if (active !== null) return null;
      active = ++sequence;
      return active;
    },
    isCurrent(id) { return id !== null && active === id; },
    finish(id) {
      if (id === null || active !== id) return false;
      active = null;
      return true;
    },
    invalidate() { sequence++; active = null; },
  };
}
