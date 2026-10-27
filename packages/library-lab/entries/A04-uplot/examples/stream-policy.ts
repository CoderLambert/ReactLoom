export type StreamPolicy = {
  advanced: boolean;
  requested: boolean;
  visible: boolean;
  reducedMotion: boolean;
  overrideReducedMotion: boolean;
};

/** A pause is a policy decision, not a lost user preference. */
export function shouldRunStream(policy: StreamPolicy): boolean {
  return policy.advanced && policy.requested && policy.visible &&
    (!policy.reducedMotion || policy.overrideReducedMotion);
}
