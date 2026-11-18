# E15 pica — independent review

2026-11-18, cwd `/home/lambert/githubRepos/lambert/ReactLoom`. Owns only this report. Retrieval began at `LIBRARY_CATALOG.md:103`, then metadata/agent/guide/verification/local-validation, all five actual runtime/type files and demo adapter, browser proposal and installed pica10.0.3 implementation/declarations. No entry/shared edits, subagents, commits, author-suite rerun, shared checks or browser execution.

**Spec verdict: PASS for reviewed source and portable integration; overall quality remains NOT_RUN pending actual browser/SDK acceptance. No blocking defect found.** Pure Node consumer below is policy/ownership evidence, not real resize/encoding SDK execution.

## Findings and acceptance boundaries

- **Low, nonblocking UI wording:** after invalidate while decode/encode is still pending, status includes “等待旧任务结束”. Finally restores running=false after settlement but does not revise that status, so the old phase text can remain while the run button is enabled. Consider replacing it with a settled-cancellation message if the current task was invalidated. This does not break epoch or single-flight ownership and is not a reason to widen validation scope.
- Actual resize, worker/CSP choice, image decoding, PNG encoding, output dimensions and URL retirement remain browser work. The supplied held-native-callback test checks stale encode publication and single-flight after actual resize; it does not prove resize cancelToken timing or physical Worker termination. The author describes this correctly.

## Installed API and ownership audit

Installed package fields are **pica10.0.3/MIT**. Actual ESM entry is `dist/pica.mjs` (not an assumed old index.js/lib path); exports include default pica factory and Pica class. Defaults at1175–1189 are js/wasm/ww, idle2000ms, filter mks2013, unsharpAmount0. Source defaults do not prove which path the browser actually used. No public component-style destroy API was found or invented in the example.

Resize's cancelToken implementation at1557–1568 converts either promise fulfillment or rejection into canceled=true and a rejection path. Worker invocation also listens for cancel-token rejection. The UI's rejecting promise is therefore valid. It attaches only during resize, clears the cancel callback after resize settles, then rechecks current task before encoding/publishing. Encoding and createImageBitmap are not described as abortable by that token.

**Null Blob handling is necessary and correctly added.** Installed `dist/pica.mjs:1616–1620` wraps native canvas.toBlob and resolves its callback value without rejecting null; its declaration promises Blob more narrowly. The UI calls actual shared assertPNGBlob before publication, requiring nonempty image/png. This is a trusted-output shape guard, not a full PNG decoder or an untrusted-file authenticity test. Native comparison explicitly rejects null and requires a real context. Both pica/native outputs are collected successfully before either is published; current-task errors clear both.

File path checks PNG/JPEG/WebP and compressed4MiB before decode; createImageBitmap is followed by positive integer dimensions/product≤16,000,000, with bitmap.close in finally even after drawing/validation errors. Post-decode pixel checking cannot prevent every decoder allocation, correctly disclosed. CSS size is not export size; targetDimensions rounds, preserves approximate aspect ratio with minimum1, restricts allowed longest edges and never enlarges.

Task-owner is a separate business module shared by UI and tests. begin is synchronously single-flight; invalidate increments epoch and calls the current resize cancellation hook but keeps active ownership until finish. Stale attach requests cancel immediately; stale finish cannot clear a newer active task. After resize, clearCancel means cancellation only invalidates the later encode result. The UI checks isCurrent after each meaningful await and uses mountedRef before finally's React update. Source/edge/level changes invalidate old work. This prevents stale result URLs without pretending native encoding physically stopped.

Each output URL is created by its own Blob effect and revoked by that effect on replacement/clear/unmount; it is not global URL cleanup. Pica worker-pool lifecycle is SDK-owned, with its idle policy; the source does not claim synchronous worker shutdown on React unmount. Browser proposal filters tracked URLs to image/png, avoiding accidental claims about internal JavaScript Worker Blob URLs.

## Independent minimum consumer

Copied unchanged example.tsx, resize-policy.mjs/.d.mts and task-owner.mjs/.d.mts to `/tmp/e15-independent-4831an1o`, optional demo adapter omitted. Added an ESM package, installed dependency symlink, a separate React consumer rendering `<PicaExample level="advanced" />`, and strict ES2022/ESNext/Bundler/react-jsx/noEmit configuration. No fresh installation or production build is claimed.

Actual command, cwd repository root:

`pnpm --filter @reactloom/library-lab exec tsc -p /tmp/e15-independent-4831an1o/tsconfig.json`

**Exit0; no diagnostics.** This proves the documented five-file source/type integration compiles outside Lab source tree, not DOM/canvas/Worker execution.

Independent new policy command, same cwd:

`node /tmp/e15-independent-4831an1o/policy-consumer.mjs`

**Exit0**, actual output:

```text
POLICY ONLY PASS: landscape/4:3 rounding and no enlargement; 16MP/4MiB boundaries; cancellation invalidates without overlapping; stale attach/finish cannot free new owner; clearCancel preserves encode-only phase; null/empty/wrong MIME rejected (no decoding claim)
```

The consumer tests 1600×900→800×450,4032×3024→240×180, no enlargement of9×7, exact16MP acceptance/above-limit rejection, exact4MiB metadata acceptance/above-limit rejection and unsupported edge. A new owner sequence checks current cancellation, stale attachment, incorrect finish IDs, old finish after a new begin, and clearCancel before later invalidation. Null/empty/wrong-MIME blobs are rejected; a merely labelled nonempty PNG Blob passes the policy, explicitly demonstrating that this helper is not decoding its bytes. It imports no pica execution and does not add to SDK PASS counts.

Author's existing seven policy tests/logs were inspected as local evidence but not rerun. No pure policy result was converted to a runtime receipt.

## Official-source verification

Independently fetched immutable `nodeca/pica@f897666f18e9daeff540fe03d2708ba74214a046/README.md`; bytes equal official/readme.md. Recomputed SHA256 **182007bb1568b7f7f42bee5a50394a21f31a6cd03884ed1a100de7e4db416c7c** matches metadata. Fixed LICENSE was independently fetched and byte-equal to official/license.txt, agreeing with installed10.0.3/MIT. Pinned source evidence justifies English fallback because there is no upstream Chinese README candidate.

Saved homepage headers show HTTP200 with X-Frame-Options deny and frame-ancestors none. blocked plus direct link is supported by actual recorded headers; no iframe load guess or fresh embed test is claimed. Original Canvas artwork/user-selected local input boundaries are explicit; no remote stock-photo/asset-license assumption.

## Six dimensions

| Dimension | Status / evidence level | Basis |
| --- | --- | --- |
| Technical accuracy | PASS — installed implementation/types and independent policy sequence | CancelToken, nonabortable encoding, null Blob handling, single-flight and ownership agree with actual10.0.3 source. |
| Explanation clarity | PASS — static review | Selection, dimensions/bytes/pixels, source-vs-result, worker ownership and operation/error paths are concrete; minor stale status wording noted. |
| Demo usefulness | NOT_RUN — actual DOM pending | Three distinct goals are plausible and source-backed; no real resizing/decoding/quality/worker observation here. |
| Source portability | PASS — copied-source strict TypeScript consumer | Five required files and environment assumptions complete, with no hidden Lab imports or CSS/provider requirements. |
| Official-source reliability | PASS — independent raw-byte/hash/license comparison and saved headers | Immutable README/license match, MIT/version verified, blocked homepage properly evidenced. |
| Results reproducibility | NOT_RUN — policy/compiler complete only | Exact commands/exits/output provided; final actual pica/DOM/browser/receipt acceptance remains controller-owned. |

Formal verification sdk/build/browser remains **NOT_RUN**. Controller's real browser run should bind output dimensions, image decoding, native comparison, stale-encode behavior and actual owned PNG URL cleanup to the final candidate; it must not relabel those observations as immediate Worker termination or full resize-cancellation coverage.

Controller follow-up: reports the nine-case candidate browser run PASS, including E15 actual resize/native comparison and held-encoder cancel/unmount cases. This reviewer did not rerun that suite or independently inspect its raw green log in this scope; the report's NOT_RUN labels distinguish this independent consumer from controller-run runtime evidence. The optional request-phase wording is retained only as a nonblocking observation; actual busy exit is represented by the enabled run button, and no additional fix/rerun is required for this batch.
