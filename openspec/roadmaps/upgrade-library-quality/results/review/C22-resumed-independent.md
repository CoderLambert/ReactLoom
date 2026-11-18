# C22 independent resumed review — 2026-11-18

Scope: read-only C22 current dirty entry; only this report written. Entry retrieval attempted `node packages/library-lab/scripts/find-library.mjs --id C22 --agent`; global loading is BLOCKED by unrelated `Invalid D01-es-toolkit: invalid official README metadata`. Used `LIBRARY_CATALOG.md:67` fallback, then library.json → agent.md → all five declared source files → verification.json, guide, tests, local evidence and pinned source snapshots. No generation, install, full SDK-suite rerun or build.

## Verdict

Spec compliance PASS for reviewed content/source scope: retain all three distinct experiments, list all three pinned dependencies, explicitly initialize customParseFormat/utc, document CSS/TS/ESM/Intl prerequisites and client boundary. No material entry defect found. Quality acceptance remains PENDING browser interaction and candidate build; this is not an author failure. Formal verification.json correctly stays NOT_RUN.

| Dimension | Status / evidence |
| --- | --- |
| Technical accuracy | PASS — static + independent real SDK consumer. calendarReport uses strict Day.js and date-fns UTC carrier; instantReport separates offset timepoint from Intl display; TZDate/addDays vs addHours yields actual 25h vs24h. Historical Moment toJSON, mutating add and overflow descriptions agree with saved fixed-version upstream source. No Moment runtime claim. |
| Explanation clarity | PASS — guide value-meaning table and first three sections explain selection, API style, model and plugin prerequisites. Each experiment names operation, observable fields and implementation; date-only UTC carrier is explicitly distinguished from storage semantics. |
| Demo usefulness | NOT_RUN for browser; static design PASS. Basic teaches strict parsing/tokens/immutability; business teaches display zones and repeated 01:30 instants; advanced teaches calendar vs elapsed duration. Helpers independently exercised below; controls, remount and keyboard behavior await controller Chromium. |
| Source portability | PASS — static + minimal Node consumer. guide “把源码迁到项目中” gives four copy files, mandatory level, fixed pnpm command, CSS import, bundler/JSX/default-import options and Next client boundary. demo.tsx is only optional Lab re-export. No Lab-private runtime import. Plugins ship with dayjs; timezone plugin is correctly unnecessary. No external resources need cleanup; module-global plugins and BadMutable caveat are disclosed. Standalone React build not independently rerun. |
| Official reliability | PASS — local pinned-source audit. All four README bytes/digests match source-evidence.json. English date-fns/TZ fallback and official Chinese Day.js are justified by saved tree evidence; Moment is historical-only. Homepage honestly unknown, with prior HTTP evidence and direct link; no fresh network/embedding verification claimed. |
| Reproducibility | NOT_RUN for completed browser/build chain; local SDK evidence PASS. Author sdk-resumed.txt records 6/6 exit0; independently matched all five resumed-inputs.json hashes to current files. Independent consumer exits0 below. These local checks are not recorder receipts. |

## Independent trial

Cwd: `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`. Existing installed dependencies used; no installation or module mocking. Ran `pnpm exec node --input-type=module` with stdin importing the public `calendarReport`, `instantReport`, `scheduleComparison` exports from `./entries/C22-moment-migration/examples/migration.mjs` and Node strict assertions. This is a new consumer, not the author's six-test suite. Exact assertions:

```js
const leap = calendarReport('2028-02-29');
assert.equal(leap.dayjsNext, '2028-03-01');
assert.equal(leap.dateFnsNext, '2028-03-01');
assert.equal(leap.originalAfterAdd, '2028-02-29');
assert.equal(calendarReport('2027-02-29').valid, false);
const point = instantReport('2026-11-01T01:30:00.250-05:00', 'Asia/Shanghai');
assert.equal(point.isoInstant, '2026-11-01T06:30:00.250Z');
assert.match(point.displayed, /14:30:00/);
const fall = scheduleComparison('fall');
assert.equal(fall.calendarElapsedHours, 25);
assert.equal(fall.elapsedHours, 24);
assert.match(fall.elapsedNext, /11:00/);
```

Observed exit0: leap formats both `2028/02/29`, next values both `2028-03-01`; Shanghai display `2026/11/01 14:30:00`; fall start `2026-10-31 12:00 -04:00`, calendarNext `2026-11-01 12:00 -05:00`, elapsedNext `2026-11-01 11:00 -05:00`, original unchanged. Final audit output: `Independent consumer PASS; 4 README digests and 5 author input hashes MATCH`.

Remaining: controller browser evidence for all three controls, invalid-input recovery, scene/tab remount, source/readme/website presentation and keyboard/console observations; candidate build and formal receipts remain separate. Shared retrieval defect belongs to D01 metadata/platform scope, not C22.

## Targeted formatting follow-up

Source is readable and split into named helpers/components, but formatting is not consistently normalized: `examples/demo.tsx:1` has compact export braces; `examples/example.tsx` has inline button/map JSX and multi-line select handlers; `examples/styles.css:1` onward uses dense single-line rules. Action: author/controller run the repository formatter for only C22 once its executable works, then retain semantic content. This is a formatting follow-up, not a demonstrated runtime defect; portability above concerns integration completeness and does not claim formatter PASS.

Attempted read-only targeted Biome validation: Lab cwd `pnpm exec biome check entries/C22-moment-migration/examples` exit1 (`npm error could not determine executable to run`); repository-root `pnpm exec biome check packages/library-lab/entries/C22-moment-migration/examples` exit254 (`[warn] Linter process terminated abnormally (possibly out of memory)`). Biome status BLOCKED, no formatting applied and no clean-lint claim. Controller reports browser test source now at `packages/library-lab/e2e/quality-resume-migration.spec.ts`; its existence is not browser execution evidence in this review.
