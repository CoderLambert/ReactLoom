/**
 * axe.run cannot overlap with another axe.run in this module's browser realm.
 * Serialize Lab-owned scans and skip work invalidated while queued.
 * This does not coordinate with unrelated applications importing axe-core.
 */
let tail = Promise.resolve();

export function enqueueAxeAudit(run, isCurrent) {
  const task = tail.then(async () => {
    if (!isCurrent()) return { skipped: true };
    return { skipped: false, result: await run() };
  });
  // A failed scan must never poison later scans.
  tail = task.then(() => undefined, () => undefined);
  return task;
}
