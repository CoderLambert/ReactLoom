import type {Level} from './types';
export function parseWorkerReply(value: unknown, runId: string): {type:'progress'|'result'|'error';message:string} | null;
export function workerStartMessage(level: Level, runId: string): {type:'start';level:Level;runId:string};
