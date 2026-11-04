export type AnimationState = {playing:boolean;visible:boolean;reducedMotion:boolean;overrideMotion:boolean};
export function shouldAnimate(state:AnimationState):boolean {
  return state.playing && state.visible && (!state.reducedMotion || state.overrideMotion);
}
/** Zero-speed animations should render one still frame, never a perpetual GPU loop. */
export function shouldRunFrameLoop(state:AnimationState,speed:number):boolean {
  return shouldAnimate(state) && Number.isFinite(speed) && speed > 0;
}
