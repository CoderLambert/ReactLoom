---
'@reactloom/api-client': patch
---

Keep non-JSON HTTP error responses classified by their status, so transient upstream HTML/text errors remain retryable and non-JSON 401 responses still report unauthorized. Successful malformed JSON responses remain validation failures.

Apply caller cancellation and per-attempt timeouts while awaiting asynchronous credentials, and prevent a cancelled credential lookup from sending a late request.

Reject request URLs that resolve outside the configured API origin before reading credentials or issuing a fetch.

Honor `Retry-After` HTTP dates for rate-limit responses and avoid negative retry delays; numeric values remain capped by the configured maximum.

Discard successful or unauthorized responses from custom fetch adapters that settle after cancellation, preventing stale 401 callbacks from invalidating a newer session.

Discard late HTTP error and success bodies when a request is cancelled during asynchronous body reading, so stale 401 responses cannot invalidate a newer session or return obsolete data.
