/** A synchronous lease; acquire before the first asynchronous browser preflight. */
export function createExclusiveSessionGate() {
  let held = false;
  return Object.freeze({
    acquire() {
      if (held) throw new Error('An MSW session is already starting or active in this iframe');
      held = true;
      let released = false;
      return () => {
        if (released) return false;
        released = true;
        held = false;
        return true;
      };
    },
    isHeld() { return held; },
  });
}
