export type PlaybackPolicy = Readonly<{
  loaded: boolean;
  visible: boolean;
  reduced: boolean;
  override: boolean;
}>;
/** Requested playback is distinct from effective playback. A hidden tab
 * cannot be overridden, even when the user has opted in to motion. */
export function mayPlay(policy: PlaybackPolicy): boolean {
  return policy.loaded && policy.visible && (!policy.reduced || policy.override);
}
export function playbackLabel(policy: PlaybackPolicy, requested: boolean): string {
  if (!policy.loaded) return '等待动画资源';
  if (!policy.visible) return '后台暂停';
  if (policy.reduced && !policy.override) return '按系统偏好暂停';
  return requested ? '正在播放' : '已暂停';
}
