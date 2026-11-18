# E13 PhotoSwipe — independent review

**Latest delta review:** controller repair is source-correct; current spec verdict **PASS at source-review level**, with final browser/typing/build acceptance still **NOT_RUN** here. The original failed baseline and its evidence are retained below. See the final delta section for closure details.

2026-11-18, cwd `/home/lambert/githubRepos/lambert/ReactLoom`. Ownership: this report only. Retrieval: `LIBRARY_CATALOG.md:101` → metadata/agent/guide → all displayed component/artwork/policy/declaration/test sources → verification/local-validation/browser proposal → installed SDK and official evidence. No entry/shared edits, subagents, commits or full checks. Review baseline is the first stable component copied to `/tmp/e13-independent-0bitckde`; example.tsx SHA256 `7152ebb52e9b0c7c221aae0734e9cde2596422de658c0a23b800f65badbfc7f9`. Controller fixes made after this snapshot require follow-up validation.

## Findings first

**Baseline spec verdict: FAIL pending opening-window lifecycle repair and dataSource wording correction. Overall quality: NOT_RUN/unfinished; no DOM SDK was executed by this reviewer.** Portable compilation and pure fixture policy pass, but cannot offset the source-proven cleanup window.

### P2 — cleanup can miss a core that is still opening

Component cleanup calls `lightbox.destroy()`. Installed Lightbox `src/js/lightbox/lightbox.js:294–302` calls `this.pswp?.destroy()`, clears shouldOpen and unregisters gallery clicks. Clearing shouldOpen protects a pending module import; it does not itself close a core already initializing/opening.

Installed `src/js/photoswipe.js:515–519`: when `isDestroying` is false, destroy sets showHideAnimationType='none', calls close(), then returns. At `495–497`, close returns whenever `!opener.isOpen` or isDestroying. Thus a core already created but still in the opening animation can receive destroy, hit the early return and remain undestroyed. `src/js/opener.js:85–90` also explicitly ignores close while isOpening. The existing fade mode exposes this window; merely waiting for `.pswp` visibility is not proof the opening has finished.

**Required action:** handle cleanup during opening explicitly, using a source-matched/public-event fallback or avoid the opening-animation window. Validate actual destroy and DOM/global-instance release when unmount/collection replacement happens while opening, in addition to fully open cleanup. Do not solve the test by always waiting until open and omit the race.

Public event ordering is suitable for a bounded retry: `opener.js:308–316` first sets isOpen=this.isOpening, isClosed=this.isClosing, isOpening=false/isClosing=false, **then** dispatches openingAnimationEnd. In that callback the opening case already has isOpen=true; a captured core can retry destroy. Then `319–322` dispatches legacy initialZoomInEnd; `325–326` invokes core.destroy only on the closing completion case. A fallback must be scoped to the captured old core, remove its listener once handled, and not act on a newer window.pswp instance. Source reasoning is not a substitute for the controller's real browser race test. Controller was informed and is preparing the entry-level fix; not yet verified in this report.

### P2 documentation — delegated clicks replace the constructor array dataSource

The component passes `dataSource: visible`, and guide/local-validation describe the SDK as using that same array. However installed Lightbox `lightbox.js:101–107` creates `{gallery:e.currentTarget}` and passes it to loadAndOpen on a thumbnail click; `185–189` preload overwrites options.dataSource with it. Therefore normal anchor clicks use **DOM gallery data**, not the constructor array. React still renders those anchors from the same visible collection, so current item order/dimensions remain aligned; this is not a discovered mismatch of displayed images. Correct the explanation rather than claiming the constructor array governs delegated clicks. Controller confirmed it will correct wording.

### Nonblocking acceptance details

- Default trapFocus/returnFocus are true, but returnFocus acts only after the SDK actually focused its root (`keyboard.js:63–77`, `_wasFocused`). A click→Escape test may pass because the anchor never lost focus. Prefer keyboard focus/Enter opening or move focus into the dialog before closing to prove returnFocus behavior.
- The proposal's core request pattern `photoswipe\.esm` matches the current existing artifact `dist/assets/photoswipe.esm-CaVaIJh5.js` (read only, no build run here). Controller must bind the final candidate's real emitted name; source dynamic import alone is not loading-time evidence.

## Source/API and migration audit

Installed package is PhotoSwipe5.4.4/MIT. Lightbox `init` attaches a container-scoped click listener; cleanup removes that exact handler. Dynamic pswpModule loads the core, and shouldOpen=false prevents late opening if a Lightbox is destroyed before the import resolves; it does not cancel downloading. Lightbox assigns the actual core to window.pswp at lines258–259 and removes it on core destroy at282–285, supporting the proposed outside-component destroy observer. Core destroy dispatches the event before clearing its listener table, removing its element and destroying content/events. The opening race above qualifies broad “destroy always closes” claims.

`visible` is memoized on level/includeExtra, used to render actual anchors, and effect depends on that reference. Caption toggling changes React figcaption, not SDK HTML captions, and does not rebuild the Lightbox. Adding/removing the fourth item changes visible and cleans up/recreates the scoped instance. Programmatic button clicks under the overlay are appropriately described as external data-change simulation rather than ordinary pointer interaction through the modal.

Migration is complete at baseline: example.tsx, gallery-policy.mjs/.d.mts, artwork.mjs/.d.mts, with optional demo.tsx re-export. Install photoswipe@5.4.4 in a React/TypeScript DOM host, retain photoswipe/style.css and ESM dynamic import/Bundler exports. No Provider, environment/service/credential or Lab-internal imports required. Array selection is a shallow slice, not a deep immutable ownership boundary; the component does not mutate selected items.

## Independent consumer: exact commands and results

Copied the five documented runtime/type files unchanged into `/tmp/e13-independent-0bitckde`, installed-dependency symlink, ESM package, strict ES2022/ESNext/Bundler/react-jsx/noEmit config with Vite client CSS declarations; separate consumer renders `<PhotoSwipeExample level="advanced" />`.

Command from repository root:

`pnpm --filter @reactloom/library-lab exec tsc -p /tmp/e13-independent-0bitckde/tsconfig.json`

**Exit0; no diagnostics.** This validates copied-source compilation, not a fresh install, production bundle or DOM PhotoSwipe execution.

New policy/fixture consumer, same cwd:

`node /tmp/e13-independent-0bitckde/policy-consumer.mjs`

**Exit0**, actual output:

```text
POLICY/FIXTURE ONLY PASS: four unique owned data SVGs with declared1200x800; no active/external template markers; deterministic1/3/4 selection; selected-range validation; invalid size/alt/duplicate rejected; input unchanged
```

The consumer directly imports actual artwork.mjs and gallery-policy.mjs; verifies four unique percent-encoded original SVG data URLs, explicit SVG width1200/height800/viewBox and metadata; checks no script/foreignObject/event/external href/src/url template markers; tests 1/3/4/3 selected IDs and nonmutation; shows an invalid fourth item is ignored by business's selected range but rejected by advanced-extra; rejects oversized dimensions, blank alt and duplicate selected IDs. This is raw fixture inspection and business policy, **not SVG parsing/decoding, a general SVG security validator, or SDK execution**. Actual image.decode/naturalWidth remains browser work.

## Official source verification

Independently fetched immutable `dimsemenov/PhotoSwipe@fd85184b450f451bc4aa2697f6d0a79304d13473/README.md`. Raw bytes exactly equal official/readme.md; recomputed SHA256 **eacde22ddd2b4a866df9f5daa72583b19610e8959d4b683f0ab85f1e07865294** matches metadata. Also independently fetched fixed LICENSE; bytes equal official/license.txt, consistent with installed5.4.4/MIT. Saved source-evidence lists root and UMD READMEs without a Chinese upstream translation; English fallback is justified.

Saved homepage evidence has concrete HTTP200 response headers but no X-Frame-Options/frame-ancestors and no actual Lab-origin content confirmation; unknown is correct. No fresh embedding test was performed. Pure data SVGs avoid remote asset licensing claims; they are authored diagrams, not photos or raster performance fixtures.

## Six dimensions at reviewed baseline

| Dimension | Status / evidence level | Basis |
| --- | --- | --- |
| Technical accuracy | FAIL — installed-source lifecycle/dataSource findings | Opening cleanup window and array-vs-DOM source wording need correction; policy/runtime API shapes otherwise align. |
| Explanation clarity | PASS with above factual corrections pending | Concrete selection, two-module model, dimensions, three distinct goals and scoped resource ownership. |
| Demo usefulness | NOT_RUN — real DOM pending | Useful decode/keyboard/caption/dynamic goals, but cleanup race and actual browser behavior not yet accepted. |
| Source portability | PASS — strict copied-source compilation | Five files, CSS/import requirements complete and compile outside Lab source tree. |
| Official-source reliability | PASS — independent byte/hash/license verification | Immutable sources match, homepage unknown accurately bounded. |
| Results reproducibility | NOT_RUN — policy/compiler complete only | Exact commands/results above; real SDK/decode/focus/loading/destroy still controller work. |

Formal verification sdk/build/browser remain NOT_RUN. Controller's fix and actual browser records should close the opening-race issue and final source correctness before declaring this entry accepted. This reviewer does not edit the entry or promote pure policy/compilation to SDK PASS.


## Controller repair — independent delta follow-up

Reviewed only the changed component/guide/agent/local-validation and public `e2e/quality-resume-photoswipe.spec.ts`, plus the already identified installed public-event ordering. No policy suite, portable compiler, full checks or browser run was repeated. Current component SHA256 is `253c6e1911c24a39705934ae17c033563352d88cec2ac1c99306fe99a8d30b47`; the first consumer results above still describe the original portable baseline, not a new runtime receipt for this repaired source.

**P2 opening cleanup: resolved in source, green browser regression pending.** `disposeLightbox` captures the actual old `lightbox.pswp`, registers `afterOpen` on public openingAnimationEnd, then calls normal Lightbox.destroy immediately. The normal call retains gallery unbinding and shouldOpen=false for late imports. If core is still opening, the captured callback survives the Lightbox listener-table reset because it was registered on the actual core directly. After opening, it removes itself with core.off before retrying core.destroy. An actual destroy event removes any unused fallback listener; final core destroy clears the core listener table. Nothing looks up a newer window.pswp to perform cleanup.

This matches installed opener event order: opener.js308–316 sets isOpen=true and isOpening=false before openingAnimationEnd; a callback can therefore pass PhotoSwipe.close's isOpen gate. `eventable.off` replaces the event listener array via filter, so removing itself during dispatch does not splice/corrupt the array being iterated. On a core already open/closing, normal destroy proceeds and its destroy event removes the unused fallback. The helper preserves fade and correctly describes eventual convergence after opening, not instantaneous DOM disappearance.

**P2 dataSource wording: resolved.** The ineffective constructor array dataSource was removed. Effect still explicitly depends on visible and declines an empty collection; JSX uses that same visible data. Guide/agent/local-validation now correctly describe delegated clicks reading current gallery DOM. No new SDK input model was introduced.

Independently read the actual pre-fix log `docs/library-lab/evidence/quality-upgrade/candidate-31/opening-regression-red.txt`: one selected test failed, expected destroy count1 but received0 after a2000ms predicate timeout; the command exited1 (`playwright test e2e/quality-resume-photoswipe.spec.ts --grep during actual opening --workers=1`). The log points to a retained trace.zip and error-context.md. This is direct review of real controller-run failure evidence, not independent browser execution; the trace itself was not replayed. The revised public regression explicitly waits for actual `core.opener.isOpening===true`, then checks that condition and clicks the unmount button within one page.evaluate call; it requires one real destroy event and no `.pswp` afterward. This targets the bug window rather than waiting for open to finish. Green execution remains controller-owned and pending at this checkpoint.

The first-opening test now uses anchor focus plus Enter and asserts focus leaves the anchor before Escape returns it, fixing the prior false-positive possibility. The initially observed public business case used mouse click followed by a not-focused assertion: installed keyboard.js44–50 deliberately focuses root automatically only when initialPointerPos is absent. A mouse-opened dialog may retain anchor focus until Tab/focus movement, so controller was advised to use keyboard Enter there as well or explicitly Tab into the dialog before asserting returnFocus. This was a test-precondition detail, not a newly discovered product defect. Follow-up read confirms business now also focuses the first anchor and presses Enter before requiring lost focus, so this suggestion is closed.

Updated six-dimension interpretation: technical accuracy **PASS for repaired source**; explanation clarity **PASS**; portability/official-source checks retain their earlier scoped PASS evidence; Demo usefulness and Results reproducibility remain **NOT_RUN for final browser acceptance**. No open product-source finding remains from this delta. Actual image decode, loading request, keyboard/focus, fully open replacement/unmount and opening-race green outcomes must still be bound to the controller's final candidate. Formal sdk/build/browser statuses are not promoted by this report.

Follow-up checkpoint: controller reports final build/typecheck/catalog PASS and a complete browser run in progress. This reviewer has not independently rerun those commands or seen final green browser output; final runtime statuses remain pending in this report.
