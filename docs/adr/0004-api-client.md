# ADR 0004: One fetch client

`@reactloom/api-client` is framework-free. Callers pass a schema with `parse` (Zod schemas qualify). The client:

- joins the base URL and sends JSON
- attaches a bearer token when one is available
- aborts on caller cancel or timeout via `AbortSignal.any` and `AbortSignal.timeout`
- retries idempotent requests with backoff, and honors `Retry-After`
- maps HTTP, network, timeout, abort, and schema failures onto `ApiError`

TanStack Query hooks own cache keys, optimistic updates, and loading or error UI. Query defaults do not retry 401, 403, 404, validation, or abort errors.
