export const TEST_HLS: string
export const DESTROY_EVENT: string
export function clearMedia(video: HTMLVideoElement | null): void
export function disposePlayback(
  engine: { destroy(): void } | null,
  video: HTMLVideoElement | null,
): void
export function validLevel(index: number, count: number): boolean
