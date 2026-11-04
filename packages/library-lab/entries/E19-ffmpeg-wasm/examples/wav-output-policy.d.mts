export function inspectPcmWav(bytes: Uint8Array, maxBytes?: number, maxSeconds?: number): Readonly<{bytes: number; sampleRate: 16000; channels: 1; seconds: number}>;
