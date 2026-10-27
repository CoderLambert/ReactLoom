/** Idempotent, best-effort teardown: a throwing listener must not retain Monaco's model or worker lease. */
export function createOwnedResourceCleanup(resources, onFailure = () => {}) {
  if (!resources || typeof resources !== 'object') throw new TypeError('Monaco resources must be an object');
  const steps = Object.freeze([
    ['resize-observer', 'observer', 'disconnect'],
    ['marker-listener', 'markerListener', 'dispose'],
    ['content-listener', 'contentListener', 'dispose'],
    ['editor', 'editor', 'dispose'],
    ['model', 'model', 'dispose'],
    ['worker-environment', 'releaseWorkers', null],
  ]);
  let closed = false;
  return () => {
    if (closed) return [];
    closed = true;
    const failures = [];
    for (const [step, key, method] of steps) {
      const resource = resources[key];
      if (resource == null) continue;
      try {
        if (method === null) {
          if (typeof resource !== 'function') throw new TypeError('Expected cleanup function');
          resource();
        } else {
          if (typeof resource[method] !== 'function') throw new TypeError('Missing ' + method);
          resource[method]();
        }
      } catch (error) {
        failures.push({step, message: error instanceof Error ? error.message : String(error)});
      }
    }
    if (failures.length) {
      try { onFailure(failures); } catch { /* Reporting must not prevent cleanup. */ }
    }
    return failures;
  };
}
