type Level = 'basic' | 'business' | 'advanced'
type Review = 'idle' | 'pending' | 'success' | 'error'

/** Hiding requests instance unmount; the SDK's shared WebGL/WASM renderer can remain alive. */
export function riveRuntimePolicy(input: {
  level: Level
  pageVisible: boolean
  inView: boolean
  reducedMotion: boolean
  manuallyPaused: boolean
  phase: Review
}): { mount: boolean; play: boolean } {
  const mount = input.pageVisible && (input.level !== 'advanced' || input.inView)
  return {
    mount,
    play:
      mount &&
      !input.reducedMotion &&
      !input.manuallyPaused &&
      (input.level !== 'business' || input.phase === 'pending'),
  }
}
