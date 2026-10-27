export const MAX_DEMO_UPDATE_BYTES: number;
export interface YjsScope {tenantId: string; documentId: string;}
export interface YjsEnvelope extends YjsScope {format: string; update: Uint8Array;}
export function validateYjsEnvelope(envelope: YjsEnvelope, expected: YjsScope): Uint8Array;
