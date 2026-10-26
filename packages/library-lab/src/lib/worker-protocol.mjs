// Dedicated Web Worker examples use a minimal message-only channel. The host
// displays text; it never evaluates messages as code or trusts claimed results.
const RESPONSE_TYPES = new Set(['progress','result','error']);
export function parseWorkerReply(value,runId) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (value.runId !== runId || !RESPONSE_TYPES.has(value.type) || typeof value.message !== 'string') return null;
  return {type:value.type, message:value.message.slice(0,4096)};
}
export function workerStartMessage(level,runId) {
  if (!['basic','business','advanced'].includes(level) || typeof runId !== 'string' || runId.length>100 || !runId) throw new Error('invalid worker start request');
  return {type:'start',level,runId};
}
