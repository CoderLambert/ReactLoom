export type TimelineConditions = {
  reducedMotion: boolean;
  pageVisible: boolean;
  userPaused: boolean;
};
/** Page visibility is an absolute pause: an explicit resume cannot animate a hidden tab. */
export function shouldPlayTimeline({reducedMotion, pageVisible, userPaused}: TimelineConditions): boolean {
  return !reducedMotion && pageVisible && !userPaused;
}
export function progressPercent(progress: number): number {
  return Number.isFinite(progress) ? Math.round(Math.max(0, Math.min(1, progress)) * 100) : 0;
}
