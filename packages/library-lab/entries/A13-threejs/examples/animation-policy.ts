export type AnimationState = {playing:boolean;visible:boolean;reducedMotion:boolean;overrideMotion:boolean};
export function shouldAnimate(state:AnimationState):boolean {
  return state.playing && state.visible && (!state.reducedMotion || state.overrideMotion);
}
