# D10 independent review — 2026-11-18

Reviewed frozen D10 metadata, guide, agent, all six declared sources, verification, root local-validation.md, official evidence and browser proposal. Only this report written; other authors' edits preserved. No SDK author-suite/policy-suite rerun, build, generation, typecheck or browser run.

## Verdict and finding

**Spec/content design PASS; complete quality acceptance remains review_pending for browser evidence.** The three distinct experiments, actual shared factory, migration boundaries and portable files meet the content design. Initial metadata finding is resolved: controller changed `official.readme.repository` from full URL to `pmndrs/zustand`. Delta check `node packages/library-lab/scripts/find-library.mjs --id D10 --agent` now exits 0 and returns the D10 identity and agent guide. Direct `validateOfficialSources(metadata.official)` exits 0 with `{"repository":"pmndrs/zustand","errors":[]}`. No SDK or upstream repeat was needed for this metadata-only correction. No unresolved blocking content finding remains.

| Quality dimension | Status and evidence |
| --- | --- |
| Technical accuracy | PASS — true Zustand 5.0.16 vanilla factory + middleware, stable React field selectors, nested immutable update, partialize output whitelist and controlled migrate. New SDK consumer confirmed isolation, restoration, malformed JSON behavior and synchronous write failure. |
| Explanation | PASS — useStore/vanilla distinction, Object.is selection and whole-panel render limitation, SSR request instances, per-team field versus security boundary, Map rebuild versus true page reload are explicit. |
| Useful demo | NOT_RUN browser — three distinct goals in actual source, business renders two independent PreferencePanel instances; controller's 3 browser proposals pending. Node execution cannot establish React subscriptions/render/unmount acceptance. |
| Migratable source | PASS source + real SDK — store.mjs/store.d.mts and migration-policy.mjs/migration-policy.d.mts are portable; documented dependency and React18+/ESM/JSX prerequisites, optional example.tsx/demo adapter, no hidden host imports/config/env/assets. Formal standalone build NOT_RUN. |
| Official reliability | PASS — README original bytes and pinned provenance independently verified; homepage correctly unknown. Delta metadata validation errors=[] and retrieval exit0 resolve the initial repository contract failure. |
| Complete reproducibility | NOT_RUN browser/build — independent SDK consumer exit 0 and exact output below; author separate 4 SDK+4 policy/local types logs read, not reclassified as receipts. verification sdk/build/browser remain NOT_RUN. |

## Independent experiment

cwd `/home/lambert/githubRepos/lambert/ReactLoom`. Actual invocation `node --input-type=module` with stdin importing `createChannelStore, makeMemoryStorage, KEY` from `./packages/library-lab/entries/D10-zustand/examples/store.mjs`; exit 0. New consumer created two private memories/stores, hydrated both, subscribed only first, set first view grid, selected team-b and toggled it, unsubscribed, then changed tenant. Asserted exactly 3 callbacks and no later notification; second store retained list/B=false and second memory remained unwritten. Parsed first JSON and asserted version2 and exactly enabledByTenant/view keys. New factory over same memory restored grid/B=true with tenant reset to A.

Next seeded `{version:1,state:{enabled:'false',view:'grid',tenant:'intruder'}}`, hydrated a new factory and asserted A=true (strict boolean fallback), identity A and rewritten version2. Seeded `{broken`, captured warning, hydrated fresh store and asserted SyntaxError/default list/hasHydrated=false. dispose removed only owned KEY, retry rehydrate succeeded. Finally injected StateStorage with throwing setItem: setView('grid') throws `quota-fixture` **after** memory state updates; production error handling is necessary as guide says, and writes are not transactional. No SDK mocks.

Exact stdout:

```json
{"isolated":true,"subscriptionCalls":3,"afterUnsubscribe":3,"storedKeys":["enabledByTenant","view"],"restored":{"tenant":"team-a","view":"grid","b":true},"stringFalseMigration":true,"malformedWarning":"SyntaxError","retryHydrated":true,"ownKeyRemoved":true,"writeFailure":"throws after in-memory update","assertions":"PASS"}
```

## Sources, failure boundaries and cleanup

Python urllib GET of `https://raw.githubusercontent.com/pmndrs/zustand/382d29c485e67018c06e75ec7235130d0968522c/README.md` compared bytes with official/readme.md and SHA256 with library metadata; exit0, exact output `{"bytes":17827,"originalMatches":true,"digestMatches":true}`. Source-evidence/tree enumerate README.md and starter README, no upstream Chinese candidate; saved English original is justified. Homepage remains unknown, saved GET is not iframe proof.

Guide explicitly limits inbound v2 validation (partialize cannot validate reads), controlled v1 fixtures, JSON parse failure before migrate, no cross-refresh Map durability, no cross-tab sync and asynchronous storage race claims. Map ownership is real (new Map inside each makeMemoryStorage), not merely separate object fields. React useStore manages subscriptions; custom vanilla listeners require unsubscribe (trial confirmed). UI cleanup disposes its private key; rebuilt stores have no manual subscribers or destroy API. StrictMode synchronous cleanup behavior is described without claiming asynchronous storage safety. Browser proposal validates actual page reload and two instances; pending execution is a genuine remaining gate.
