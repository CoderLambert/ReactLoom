---
'@reactloom/api-client': patch
---

Keep non-JSON HTTP error responses classified by their status, so transient upstream HTML/text errors remain retryable and non-JSON 401 responses still report unauthorized. Successful malformed JSON responses remain validation failures.

Apply caller cancellation and per-attempt timeouts while awaiting asynchronous credentials, and prevent a cancelled credential lookup from sending a late request.

Reject request URLs that resolve outside the configured API origin before reading credentials or issuing a fetch.

Honor `Retry-After` HTTP dates for rate-limit responses and avoid negative retry delays; numeric values remain capped by the configured maximum.

Discard successful or unauthorized responses from custom fetch adapters that settle after cancellation, preventing stale 401 callbacks from invalidating a newer session.

Discard late HTTP error and success bodies when a request is cancelled during asynchronous body reading, so stale 401 responses cannot invalidate a newer session or return obsolete data.

Settle caller cancellations and per-attempt timeouts even when a custom fetch adapter or response body reader never resolves its promise; ignore late adapter outcomes.

Caller cancellation now settles retry backoff even when a custom sleep function ignores the supplied AbortSignal and remains pending; late sleep outcomes cannot start a retry.

Preserve the original 401 unauthorized result without retries if the application unauthorized callback or its logger throws.

Throwing application retry loggers no longer suppress HTTP or network retries or replace original API errors; HTTP 503 and transport-failure paths have dedicated regression tests.

Prevent Fetch from following HTTP redirects, including cross-origin 307 responses, when sending API requests. Fail closed on 3xx and browser opaque-redirect responses; injected fetch adapters must honor the manual redirect policy to prevent forwarding credentials.

Bound noncooperative custom retry schedulers even when callers omit AbortSignal: the backoff may run for its requested delay plus one attempt timeout, then settles with a timeout error rather than waiting forever or repeating the failed backoff. The provided scheduler signal also observes that deadline.

Reject nonfinite, fractional, negative or excessive retry/timeout/backoff settings as validation errors before scheduling timers or making network requests; cap retries to 20 attempts, preserve request-level `retry: 0` as one attempt, and keep combined retry deadlines within the Node timer range.

Avoid logging raw request paths in retry diagnostics: URL segments and query parameters can contain credentials or personal data. Retry logs retain method, status/error code, and attempt metadata.

Round fractional numeric `Retry-After` seconds up to whole milliseconds so retry deadline creation cannot throw a timer-range error.

Normalize malformed request paths and invalid API base URLs to validation errors before reading credentials or fetching, instead of exposing raw URL parser TypeErrors.

Reject malformed request header names and values as validation errors before invoking the token provider or transport. Retried requests preserve custom headers and refresh authorization for each attempt. Invalid bearer token values are also reported as validation failures without retrying or making network requests.

Reject malformed or forbidden HTTP methods and GET/HEAD requests with bodies before reading credentials or sending network requests; these invalid Fetch inputs no longer masquerade as retryable network failures.
