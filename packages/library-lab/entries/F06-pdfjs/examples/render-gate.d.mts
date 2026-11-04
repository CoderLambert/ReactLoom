/** A rejection in a prior render must not block the next request. */
export function createRenderGate(): <T>(operation: () => T | Promise<T>) => Promise<T>
