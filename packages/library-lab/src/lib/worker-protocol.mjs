// Dedicated Web Worker examples use a minimal message-only channel. The host
// displays text; it never evaluates messages as code or trusts claimed results.
const RESPONSE_TYPES = new Set(['progress','result','error']);
export function parseWorkerReply(value,runId) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (value.runId !== runId || !RESPONSE_TYPES.has(value.type) || typeof value.message !== 'string') return null;
  // One visible log item must not impersonate multiple records or reverse labels.
  const message=value.message.replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/gu,' ').slice(0,4096);
  return {type:value.type, message};
}
/** Keep a bounded transcript, but never hide the terminal outcome at the cap. */
export function appendWorkerLog(lines, reply) {
  const recent = lines.slice(-40);
  if (reply.type === 'progress' && recent.length === 40) return recent;
  return [...recent.slice(-39), reply.message];
}
export function workerStartMessage(level,runId) {
  if (!['basic','business','advanced'].includes(level) || typeof runId !== 'string' || runId.length>100 || !runId) throw new Error('invalid worker start request');
  return {type:'start',level,runId};
}
