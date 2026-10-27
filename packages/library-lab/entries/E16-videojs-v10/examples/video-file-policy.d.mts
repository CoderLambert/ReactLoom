export const MAX_VIDEO_BYTES: number;
export function validateVideoMetadata(file: Pick<File,'type'|'size'|'slice'> | null): 'video/mp4' | 'video/webm';
export function validateVideoHeader(type: string, data: Uint8Array): void;
