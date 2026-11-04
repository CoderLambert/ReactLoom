// Expiry is exclusive: a token is unusable at its exact expiration instant.
export function isSessionExpired(expiresAt: number, now = Date.now()): boolean {
  return !Number.isFinite(expiresAt) || expiresAt <= now
}
