---
'@reactloom/api-client': patch
---

Keep non-JSON HTTP error responses classified by their status, so transient upstream HTML/text errors remain retryable and non-JSON 401 responses still report unauthorized. Successful malformed JSON responses remain validation failures.
