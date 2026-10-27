/** Own only the worker mapping installed by this Lab instance. Monaco owns worker termination. */
const records = new WeakMap();
export function acquireWorkerEnvironment(host, factory) {
  if (!host || typeof host !== 'object') throw new TypeError('A global worker host is required');
  let record = records.get(host);
  if (!record) {
    if (host.MonacoEnvironment !== undefined) {
      throw new Error('An external MonacoEnvironment already owns worker configuration');
    }
    const environment = factory();
    if (!environment || typeof environment.getWorker !== 'function') {
      throw new TypeError('Monaco worker factory must return getWorker');
    }
    host.MonacoEnvironment = environment;
    record = {environment, holders: 0};
    records.set(host, record);
  } else if (host.MonacoEnvironment !== record.environment) {
    throw new Error('MonacoEnvironment was replaced while Lab editors were mounted');
  }
  record.holders++;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    record.holders--;
    if (record.holders === 0) {
      if (host.MonacoEnvironment === record.environment) delete host.MonacoEnvironment;
      records.delete(host);
    }
  };
}
