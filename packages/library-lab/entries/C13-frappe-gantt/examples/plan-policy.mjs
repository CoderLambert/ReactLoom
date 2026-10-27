// Calendar days and dependency graphs belong to the domain, not the Gantt widget.
export function validCivilDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + 'T00:00:00Z');
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function validatePlan(tasks) {
  if (!Array.isArray(tasks)) return '计划必须是任务数组';
  const byId = new Map();
  for (const task of tasks) {
    if (!task || typeof task.id !== 'string' || !task.id.trim()) return '任务 ID 不能为空';
    if (byId.has(task.id)) return '任务 ID 不允许重复';
    byId.set(task.id, task);
  }
  const pending = new Map();
  const downstream = new Map([...byId.keys()].map(id => [id, []]));
  for (const task of tasks) {
    if (!validCivilDate(task.start) || !validCivilDate(task.end) || task.start > task.end)
      return task.id + ' 的日期区间无效';
    if (!Number.isFinite(task.progress) || task.progress < 0 || task.progress > 100)
      return task.id + ' 的进度必须是有限的 0–100 数字';
    if (typeof task.dependencies !== 'string') return task.id + ' 的依赖格式无效';
    const deps = task.dependencies.split(',').map(id => id.trim()).filter(Boolean);
    if (new Set(deps).size !== deps.length) return task.id + ' 的依赖存在重复 ID';
    for (const id of deps) {
      if (!byId.has(id) || id === task.id) return task.id + ' 存在非法任务依赖';
      downstream.get(id).push(task.id);
    }
    pending.set(task.id, deps.length);
  }
  const queue = [...pending].filter(([, degree]) => degree === 0).map(([id]) => id);
  let processed = 0;
  for (let index = 0; index < queue.length; index++) {
    processed++;
    for (const dependent of downstream.get(queue[index])) {
      const left = pending.get(dependent) - 1;
      pending.set(dependent, left);
      if (left === 0) queue.push(dependent);
    }
  }
  return processed === byId.size ? null : '任务依赖存在闭环，已拒绝保存';
}
