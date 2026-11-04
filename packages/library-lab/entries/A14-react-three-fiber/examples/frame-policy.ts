/** Pure per-frame gate; the actual renderer is @react-three/fiber. */
export type FramePolicy = {
  paused: boolean;
  reducedMotion: boolean;
  visible: boolean;
  speed: number;
};

export function shouldRunFrames({paused, reducedMotion, visible, speed}: FramePolicy): boolean {
  return !paused && !reducedMotion && visible && Number.isFinite(speed) && speed > 0;
}

/** Prevent a throttled/background RAF delta from skipping large rotations. */
export function boundedFrameDelta(delta: number): number {
  return Number.isFinite(delta) ? Math.max(0, Math.min(0.1, delta)) : 0;
}
