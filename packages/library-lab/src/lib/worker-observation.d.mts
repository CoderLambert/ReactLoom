export type WorkerOutcome = 'running' | 'worker-reported-result' | 'worker-reported-error' | 'host-error' | 'timeout';
export interface WorkerObservation {
  schema: 'library-lab/worker-observation/v1';
  assurance: 'unverified-browser-observation';
  runId: string;
  entryId: string;
  demoId: string;
  level: 'basic' | 'business' | 'advanced';
  sourceFingerprint: string;
  startedAt: number;
  endedAt: number | null;
  outcome: WorkerOutcome;
  log: string[];
}
export function beginWorkerObservation(input: {runId: string; entryId: string; demoId: string; level: WorkerObservation['level']; sourceFingerprint: string; startedAt: number}): WorkerObservation;
export function observeWorkerReply(report: WorkerObservation, reply: {type: 'progress' | 'result' | 'error'; message: string} | null, at: number): WorkerObservation;
export function failWorkerObservation(report: WorkerObservation, message: string, at: number, kind?: 'host-error' | 'timeout'): WorkerObservation;
export function serializeWorkerObservation(report: WorkerObservation): string;
