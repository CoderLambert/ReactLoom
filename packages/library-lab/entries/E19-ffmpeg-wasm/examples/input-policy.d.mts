export const MAX_INPUT_BYTES: number;
export const MAX_OUTPUT_BYTES: number;
export function isAllowedMediaFile(file: Pick<File, 'size' | 'type'> | null): boolean;
export function validateInputMedia(file: Pick<File, 'size' | 'type'>, bytes: Uint8Array): 'wav' | 'mp3' | 'webm' | 'mp4';
export function validateOutputWav(bytes: Uint8Array): number;
