const TERMINAL = new Set(['done', 'error', 'cancelled']);
const STATES = new Set(['queued', 'running', ...TERMINAL]);

/** Never allow a late async callback to move a terminal job back to running/done. */
export function transitionJob(jobs, id, next) {
  if (!Array.isArray(jobs) || !Number.isSafeInteger(id) || !STATES.has(next)) {
    throw new TypeError('Invalid job transition');
  }
  let changed = false;
  const result = jobs.map(job => {
    if (job.id !== id || TERMINAL.has(job.state) || job.state === next) return job;
    const allowed = job.state === 'queued'
      ? next === 'running' || next === 'cancelled'
      : job.state === 'running' && TERMINAL.has(next);
    if (!allowed) return job;
    changed = true;
    return {...job, state: next};
  });
  return changed ? result : jobs;
}

export function cancelUnsettledJobs(jobs) {
  if (!Array.isArray(jobs)) throw new TypeError('jobs must be an array');
  let changed = false;
  const result = jobs.map(job => {
    if (job.state !== 'queued' && job.state !== 'running') return job;
    changed = true;
    return {...job, state: 'cancelled'};
  });
  return changed ? result : jobs;
}
