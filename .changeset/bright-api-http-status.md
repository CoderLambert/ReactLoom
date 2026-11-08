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
