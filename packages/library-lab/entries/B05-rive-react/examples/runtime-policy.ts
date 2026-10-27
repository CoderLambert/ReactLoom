type Level = 'basic' | 'business' | 'advanced';
type Review = 'idle' | 'pending' | 'success' | 'error';

/** Mount and animation are distinct decisions: page hiding releases WebGL resources. */
export function riveRuntimePolicy(input: {
  level: Level;
  pageVisible: boolean;
  inView: boolean;
  reducedMotion: boolean;
  manuallyPaused: boolean;
  phase: Review;
}): { mount: boolean; play: boolean } {
  const mount = input.pageVisible && (input.level !== 'advanced' || input.inView);
  return {
    mount,
    play: mount && !input.reducedMotion && !input.manuallyPaused &&
      (input.level !== 'business' || input.phase === 'pending'),
  };
}
