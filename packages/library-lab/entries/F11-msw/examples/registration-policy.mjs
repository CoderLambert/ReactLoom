/** Strictly check the dedicated MSW scope; an origin-wide worker must never qualify. */
export function findExactScopeRegistration(registrations, expectedScope) {
  return Array.from(registrations).find((registration) => registration?.scope === expectedScope) ?? null;
}
export function assertWorkerRegistration(registration, expectedScope, expectedScript) {
  if (!registration || registration.scope !== expectedScope) {
    throw new Error('MSW registration scope is not the isolated runner scope');
  }
  const candidates = [registration.active, registration.waiting, registration.installing]
    .map((worker) => worker?.scriptURL).filter(Boolean);
  if (!candidates.includes(expectedScript) || candidates.some(script => script !== expectedScript)) {
    throw new Error('MSW registration script is not the expected same-origin worker');
  }
  return registration;
}
