# D04 p-queue — independent review and minimum consumer trial

Reviewed 2026-11-18 in `/home/lambert/githubRepos/lambert/ReactLoom`. Scope is current D04 working-tree content, not HEAD or the historical CI tree. This reviewer owns only this report; entry/shared files were not changed. Retrieval began at `LIBRARY_CATALOG.md:71`, followed by library.json → agent.md → guide.md → examples/example.tsx and demo.tsx → verification.json, SDK tests, local logs and proposed browser tests. Applied root/package/entry AGENTS, COORDINATION, IMPLEMENTATION, REPAIR and library-lab-quality references. No broad generation, suite, build or browser run was performed.

## Findings and verdict

**Spec: PASS for reviewed content and portable source; runtime acceptance incomplete. Quality: NOT_RUN overall until browser and integration validation.** No material implementation defect found in this review. This is not an SDK/build/browser receipt.

- **Low — obsolete evidence notes**, `verification.json` sdk/build notes: dependency execution is described as absent and a PLATFORM lock update as required, although installed p-queue is 10.0.0, the root importer exists, and `validation/sdk.log` records 5/5 local SDK tests. Preserve NOT_RUN formal statuses, but describe the missing matching receipt and integrated build instead of a nonexistent installation prerequisite. `local-validation.md` already discloses the stale build note.
- **Pending acceptance**, `validation/browser.spec.ts`: the proposal remains outside the public selected e2e suite. Controller must integrate/run it against a frozen candidate. Its two tests assert priority/start timestamps, strict window, pause/resume, failure isolation, cancellation and unload/remount. These assertions have not been independently observed in a browser. Final candidate build/typecheck/browser evidence remains a shared dependency.

## Selection, teaching and observable behavior

The guide gives a concrete choice: p-limit for concurrency alone; p-queue when launch rate, pause, backlog and waiting priority are also required; durable queues for crash recovery. It correctly excludes caching and distributed quotas. Basic demonstrates seven tasks and a selectable concurrency ceiling; business adds twelve RSS fixtures, a strict 600ms/3 launch window and RSS-8 priority 5; advanced injects task-4 failure and batch cancellation. The three objectives are distinct and progressive.

The example imports real PQueue and constructs the actual queue. Local abortable sleep replaces only business I/O; SDK concurrency, strict rate control, priority, pause/start and queued-signal handling are real. It clearly states no HTTP, retry/Retry-After, persistence or live RSS integration. Start order and relative timestamps permit rate/priority observation; business callback counters explain why UI running counts are separate from SDK pending release. Priority cannot preempt already running tasks. Pause permits current tasks to finish. Shared abort is passed both to add options and work, and generation prevents stale updates after unmount/level change. No Lab-internal imports or stylesheet dependency is required for functional reuse; host styling affects presentation only.

**v10 correction confirmed:** installed `p-queue/dist/index.js:695–729` documents and implements clear rejecting queued add promises with DOMException AbortError while retaining running work. Both guide and agent now state this correctly. Clear is not the demo cancellation mechanism; pause plus shared AbortController cancels queued promises and cooperative running sleep. The installed package declares 10.0.0, ESM and Node >=22. The archived source references target v10, not older EventEmitter-era instructions.

## Independent minimum consumer

Used documented migration: copied only `examples/example.tsx` into `/tmp/d04-independent-km6j3hoe`, declared an ESM consumer, imported it from `consumer.tsx` and rendered `<QueueWorkshop level="business" />`. The temporary consumer used installed React/types/PQueue through a symlink to Lab node_modules, with strict TypeScript, ES2022, NodeNext and react-jsx. No fresh install or lockfile claim is made.

Actual command from repository root:

`pnpm --filter @reactloom/library-lab exec tsc -p /tmp/d04-independent-km6j3hoe/tsconfig.json`

Exit **0**, no diagnostics. This proves copied source and declared component integration compile outside the Lab source tree; it does not prove browser mounting or production bundling.

Also ran a separate Node ESM minimum consumer against installed PQueue: queued one manually released running task and one waiting task; attached assert.rejects for AbortError; called clear; asserted pending remains 1; released running task and asserted its successful result; awaited onIdle. Exit **0**, output `independent clear consumer PASS: waiting AbortError, running continues`. This independently verifies the disputed API boundary without rerunning the full suite.

Existing author evidence reviewed: `validation/sdk.log` shows 5 tests / 5 pass / 0 fail, and tests genuinely import PQueue. They cover concurrency/failure settlement, pre-start abort, paused abort, strict rolling rate/priority and clear semantics. The log is local execution evidence, not an independently recreated formal receipt.

## Official source verification

`library.json` pins README to `sindresorhus/p-queue` commit `7f272ab5ff2254c0dc2537b7977e88ede1cd55e8`, readme.md, version 10.0.0, English. Independently fetched its immutable raw URL with Python urllib; upstream bytes exactly equal `official/readme.md`. SHA256 independently recomputed as `da4c31fd3a51c874e450ba734ad91852c54100ec47d41aa9f8efea9d43dbcc24`, equal to metadata. Saved tree.json has that commit SHA and only readme.md as README candidate; English fallback is justified. The recorded homepage GET is HTTP/2 200 with `x-frame-options: deny` and CSP `frame-ancestors 'none'`; blocked is supported by saved header evidence, not inferred from iframe load. A fresh homepage request/browser embed test was unnecessary for this response-header finding and was not performed.

## Six quality statuses

| Dimension | Status / evidence level | Evidence |
| --- | --- | --- |
| Technical accuracy | PASS — installed SDK source plus independent API execution | v10 clear semantics, EventTarget version guidance, strict window, priority and signal match source/tests. |
| Explanation clarity | PASS — static content review | Choice/model/three scenarios/minimum migration make inputs, state changes and expected results concrete. |
| Demo usefulness | NOT_RUN — design/source reviewed only | Real scheduler and visible start data are present; actual browser controls, lifecycle and results remain pending. |
| Source portability | PASS — isolated copied-source strict TypeScript consumer | Documented dependency and one component suffice to compile; no Lab-internal imports. Browser/build still separate. |
| Official source reliability | PASS — byte comparison/digest and saved response headers | Immutable v10 README matches upstream; blocked homepage evidence is explicit. |
| Results reproducibility | NOT_RUN — partial real execution available | Independent clear probe and consumer compile pass; author SDK log 5/5; formal receipt, candidate build and browser remain missing. |

Formal `verification.json` sdk/build/browser remain **NOT_RUN**. Next: integrate proposed @D04 browser suite, run candidate-scoped validation and record receipts only for their actual executed targets. No entry changes, commits or shared validation were performed by this reviewer.
