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
/** Bound React updates while leaving GSAP in charge of frame-by-frame DOM animation. */
export function shouldPublishProgress(previous: number, next: number): boolean {
  if (!Number.isInteger(next) || next < 0 || next > 100) return false;
  if (!Number.isFinite(previous) || previous < 0) return true;
  return next !== previous && (next === 0 || next === 100 || Math.abs(next - previous) >= 5);
}
