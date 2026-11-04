---
'@reactloom/api-client': patch
---

Keep non-JSON HTTP error responses classified by their status, so transient upstream HTML/text errors remain retryable and non-JSON 401 responses still report unauthorized. Successful malformed JSON responses remain validation failures.

Apply caller cancellation and per-attempt timeouts while awaiting asynchronous credentials, and prevent a cancelled credential lookup from sending a late request.

Reject request URLs that resolve outside the configured API origin before reading credentials or issuing a fetch.
