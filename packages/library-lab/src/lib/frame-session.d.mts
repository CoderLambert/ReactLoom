export const APP_ORIGIN: string;
export const RUNNER_ORIGIN: string;
export const FRAME_PROTOCOL: string;
export const SESSION_ID: RegExp;
export interface RunnerRequest {method: string; url: string; status: number; body: string}
export interface RunnerEvent {type: string; scope?: string; cleanup?: boolean; message?: string; requests?: RunnerRequest[]}
export interface FrameSession {session: string; scope: string; dispose(): Promise<boolean>}
export function createMswFrameSession(options: {window?: Window; level: 'basic'|'business'|'advanced'; onEvent(event: RunnerEvent): void; stopTimeoutMs?: number}): FrameSession;
