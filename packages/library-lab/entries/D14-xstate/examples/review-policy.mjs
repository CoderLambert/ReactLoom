export const MAX_REJECTION_REASON_LENGTH = 200;

// XState is allowed to receive programmatic events outside its React buttons.
// Enforce the invariant in the machine guard, not only with disabled controls.
export function isValidRejection(event) {
  return event?.type === 'REJECT' && typeof event.reason === 'string' &&
    event.reason.trim().length > 0 && Array.from(event.reason.trim()).length <= MAX_REJECTION_REASON_LENGTH;
}

export function normalizeRejectionReason(reason) {
  return typeof reason === 'string' ? reason.trim() : '';
}
