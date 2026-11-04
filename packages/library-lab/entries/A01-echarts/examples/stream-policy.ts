export const MAX_READING_UPDATES = 120;

export type PlaybackInputs = {
  level: 'basic' | 'business' | 'advanced';
  requested: boolean;
  visible: boolean;
  reducedMotion: boolean;
  allowMotion: boolean;
  exhausted?: boolean;
};

export function shouldAdvanceReadingStream(state: PlaybackInputs): boolean {
  return state.level === 'advanced' && state.requested && state.visible && !state.exhausted &&
    (!state.reducedMotion || state.allowMotion);
}

export function advanceReadingCounts(values: readonly number[], tick: number): number[] {
  if (values.length === 0 || !Number.isSafeInteger(tick) || tick < 0) return [...values];
  const selectedIndex = tick % values.length;
  return values.map((value,index)=>index === selectedIndex ? value + 3 : value);
}
