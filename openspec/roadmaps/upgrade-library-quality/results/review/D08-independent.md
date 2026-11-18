# D08 Ky independent review · 2026-11-18

Read-only entry review; only this report written. Retrieval began at LIBRARY_CATALOG.md:75 then current library.json, agent.md, guide.md, all four declared sources, verification/local-validation, entry AGENTS, tests and pinned official evidence. No entry/shared mutation, install, generation, build or author-suite rerun.

**Spec verdict: PASS for content/source scope. Quality verdict: pending controller browser/build; no material defect found.** Three experiments remain distinct, shared real transport is complete and the SDK/business/fixture boundaries are explicit. Browser expectations below have not been promoted to observed results.

|Dimension|Status and concrete evidence|
|---|---|
|Technical accuracy|PASS, static + independent SDK. Installed ky/package.json is 2.2.0, Node >=22. Fixed README timeout/totalTimeout/maxResponseSize definitions agree with guide; response size counts consumed decompressed bytes and is not a total memory bound. Independent real Ky GET retry, POST409/error.data and abort behave as described. Schema belongs to validateSources, not Ky.|
|Explanation clarity|PASS, static. Guide opens with source-search problem and native Fetch HTTP distinction; selection separates HTTP transport from Query cache and p-queue. Model explains JSON unknown → validation → generation ownership. Three operation/result sections and migration instructions identify actual files and limitations.|
|Demo usefulness|NOT_RUN for real browser; design PASS. Basic demonstrates GET plus runtime schema; business demonstrates distinct slow/security vs fast/frontend results, filtering, cancellation and IME gate; advanced independently demonstrates repeatable GET503 recovery, nonretry POST409, timeout, schema, size and204. Controller must execute controls/race/IME/unmount.|
|Source portability|PASS, static + shared transport consumer. Fixed `pnpm add ky@2.2.0`, three necessary files, existing React automatic runtime, ESM/bundler-or-NodeNext and DOM Fetch APIs documented. No mandatory CSS/env/service/secret or Lab-private runtime. Production fixture removal and trusted URL replacement explicit. Abort/listener/timer cleanup is resource-scoped. Read-only Biome check exit0: seven files, no fixes. Standalone React build not run.|
|Official sources|PASS, local audit. README SHA256 independently matches metadata `ae9b82f36fd7031f259c7e7c66aaccc9ca18289d3bcd1f3e63aa0fa93dc9ba2d`; immutable commit3541888878c4d303a8bc2ad61815f4e048f55a5d, language/root selection and date are saved. Homepage correctly blocked from saved HTTP200 + XFO deny/CSP frame-ancestors none; no embedding claim. Network provenance reused, not freshly fetched in this review.|
|Reproducible results|NOT_RUN for complete browser/build chain; independent local SDK consumer PASS. Author records four SDK + one distinct policy checks; reviewer did not rerun them. New consumer below exits0 and verifies actual error payload and request count. verification.json remains formally NOT_RUN without recorder receipts.|

## Source/behavior review

`example.tsx` search clears pending simulation timer, aborts previous controller, increments generation and admits results only for matching, nonaborted ticket. Catch also checks ticket. Explicit cancel clears timer and aborts; unmount increments generation, aborts and clears timer. Composition ref blocks form submit during composition. `transport.mjs` pause unregisters abort listener both on completion and abort, and clears timeout on abort. Thus no static resource ownership defect found; actual React lifecycle remains browser pending.

GET retries restricted to one extra GET503 attempt; retry button resets transient count each time. POST explicitly limit0; DELETE204 deliberately avoids JSON. Advanced branches each receive current controller; stale completions cannot overwrite the new result. timeout30 vs fixture200, body1024 vs limit100, and HTTP200 javascript URL rejection each exercise a different boundary. Types mirror shared transport exports. JSX and JS are normally formatted; `pnpm --filter @reactloom/library-lab exec biome check entries/D08-ky/examples entries/D08-ky/tests entries/D08-ky/library.json` exit0: `Checked 7 files in 6ms. No fixes applied.`

## Independent consumer

Cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`; `pnpm exec node --input-type=module` via stdin, exit0. Used installed real Ky2.2.0 and documented `createFixtureTransport`/`validateSources` imports; no SDK mocking or external HTTP. Created client with fixture.fetch, timeout1200, totalTimeout2500, retry limit1/methods get/statusCodes503/backoffLimit400. Queried new `rss` filter, recovered transient GET, posted `id:rss` with limit0 and inspected real HTTPError.data, aborted slow query and checked README digest. Assertions: IDs exactly rss; recovered.attempts2; HTTP409 and POST attempt1; AbortError; README hash match.

Exact stdout:

```json
{
  "ids": ["rss"],
  "recovered": {"ok": true, "attempts": 2},
  "conflict": {
    "status": 409,
    "data": {"code": "STALE_VERSION", "message": "请刷新服务端版本"},
    "attempts": 1
  },
  "cancel": "AbortError",
  "readme": "SHA256 MATCH"
}
```

No actionable entry defect. Remaining controller validation: execute real browser three scenarios and verify manual cancel also cancels scheduled fast timer; console, keyboard and unmount/remount observations; candidate build and formal receipts separately. `validation/browser.spec.ts` is a proposal, not execution evidence, and does not by itself prove genuine OS IME behavior, real network/CORS or server idempotency.
