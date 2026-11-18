# D14 XState — independent review and consumer trial

Reviewed 2026-11-18 at `/home/lambert/githubRepos/lambert/ReactLoom`, current stable working-tree D14. Ownership: this report only. Retrieval began at `LIBRARY_CATALOG.md:81`, then library.json/agent.md/guide.md, all five displayed sources, verification/local-validation, SDK/policy suites and two proposed browser tests. Applied current root/package/entry instructions and previously read library-lab-quality references. No prior entry was revisited, and no shared/source edits, broad checks, commits or browser execution occurred.

**Spec verdict: PASS for reviewed content and minimum integration. Overall quality: NOT_RUN pending browser/integrated acceptance.** No material implementation defect identified. Local execution below is not a formal receipt.

## Findings and pending work

- **Low — stale execution notes:** verification.json sdk says actual installation/execution remains pending, AGENTS says current SDK not run, and library.json provenance note says SDK not run. These conflict with documented 4/4 local actual-machine SDK execution. Preserve formal NOT_RUN statuses; clarify local execution versus missing matching receipt. Do not imply a receipt exists.
- **Controller dependency:** `validation/browser.spec.ts` is still a proposal outside the public selected suite. Integrate and execute its two @D14 cases on the frozen candidate; browser interactions, Strict Mode lifecycle and final integrated build/typecheck are NOT_RUN here. Browser suite covers 200/201 emoji guards, publication, retry ceiling and fresh actor after remount. Direct programmatic illegal-event checks belong to SDK execution, not disabled-button assertions.

## Teaching, machine and integration audit

Selection is concrete: mutually exclusive stages plus guarded events and retry budget justify XState; individual toggles/shared values/query caches do not. The same review case progresses from draft→reviewing→published to rejection normalization, then finite retries. State, event, context, guard and assign are introduced through that case. Remote authorization and rollback are explicitly excluded.

UI and SDK import the actual shared `review-machine.ts`; tests do not recreate a parallel machine. `review-policy.mjs` is custom business policy, not SDK validation. Its trim-plus-Array.from count means Unicode codepoints, not graphemes or UTF-16 units. Removing HTML maxLength preserves agreement between policy and input. UI and machine use the same guard policy, but the actor also rejects malformed programmatic REJECT, independent of disabled controls.

The machine has no timers, invoke, persistence, requests or hidden backend. Synchronous XState dispatch really owns transitions/context. Unsupported state/event pairs are ignored. A successful retry increments consumed retries and clears reason, capped at two; RESET in rejected/published clears both fields. Actor subscription is created in effect, then unsubscribe and stop run on cleanup, with ref clearing conditional on instance identity. Stop is not presented as a remote POST rollback. Three levels are a teaching progression over one shared machine; hidden advanced controls do not define different machines.

Migration files are complete: example.tsx, review-machine.ts, review-policy.mjs/.d.mts; demo.tsx is only an optional Lab re-export. Install xstate@5.33.3 in a React/TypeScript browser host; no @xstate/react, CSS, Lab imports, account or service config required. TypeScript bundler resolution supports the extensionless machine import; direct Node SDK uses explicit .ts and needs native type erasure (documented Node >=22.18). Shared policy declarations cover the imported exports. No unmentioned Node loader was needed for this trial.

## Independent consumer and exact results

Copied the four documented migration files unchanged into `/tmp/d14-independent-fzyqc0ab`; ESM package, node_modules symlink to installed Lab dependencies, strict ES2022/ESNext/Bundler/react-jsx config. Added a consumer rendering `<XStateExample level="advanced" />`. No fresh installation is claimed.

Commands from repository root, both exit **0**:

`pnpm --filter @reactloom/library-lab exec tsc -p /tmp/d14-independent-fzyqc0ab/tsconfig.json`

Output: no diagnostics. Isolated source integration compiles; this is not Vite production build or browser evidence.

`node /tmp/d14-independent-fzyqc0ab/trial.mjs`

```text
PASS actual machine actor: unsupported events ignored; 200-codepoint mixed Unicode accepted/201 rejected; retry reset and cap2; unsubscribe silent; stop blocks events
```

The real installed xstate 5.33.3 actor uses copied unchanged review-machine.ts. A new sequence sends RESET/UNSUPPORTED/RETRY in draft, then SUBMIT and invalid numeric/blank/201-emoji reasons; all remain in the expected state. A trimmed reason of 199 emoji plus one Chinese character (200 codepoints) is accepted and normalized. RETRY1→APPROVE→RESET verifies budget reset from published, then a new three-cycle rejection/retry sequence stops at rejected/retries2. After unsubscribe, RESET changes the machine without further observer notifications; after stop, SUBMIT is ignored and snapshot status is stopped. This tests behavior without UI reliance and does not duplicate the full suite.

Author evidence reviewed separately: local-validation reports actual shared-machine SDK4/4 and policy2/2. SDK test source genuinely imports createActor and review-machine.ts; policy-only tests remain separately counted. These are local evidence, not formal receipt PASS.

## Official materials

Independently fetched immutable README at statelyai/xstate commit `6a85c4057dc7c0906381664249e0b1bac300cd92`. Upstream bytes exactly match official/readme.md; recomputed SHA256 `1419a7c9b667dc08b9207681fd304436045403f49c112a6406f4650515f3598c` matches metadata. Saved recursive tree SHA matches, truncated=false, root README.md present with no Chinese README candidate. Official English fallback and pinned 5.33.3 source are appropriate; installed package reports 5.33.3.

Saved homepage response evidence shows 308 to `/docs/xstate/v5`, then HTTP200, without X-Frame-Options or frame-ancestors. Metadata correctly preserves unknown because actual Lab-origin browser content is unconfirmed. This review did not freshly test homepage embedding; missing restriction headers alone cannot establish allowed.

## Six quality statuses

| Dimension | Status / evidence level | Evidence |
| --- | --- | --- |
| Technical accuracy | PASS — actual actor trial and source | Guards, codepoint normalization, unsupported events, retry/reset and lifecycle confirmed using displayed machine. |
| Explanation clarity | PASS — static review | Case-driven model, selection boundaries, progressive operations and explicit SDK/business policy distinction. |
| Demo usefulness | NOT_RUN — source/design only | Three distinct goals map to real machine; actual UI/Strict Mode/remount pending browser. |
| Source portability | PASS — isolated strict compilation plus actor execution | All documented files compile together, and unchanged machine imports/run outside Lab source tree. |
| Official source reliability | PASS — byte/hash verification and saved headers | Fixed official README verified; homepage unknown correctly constrained. |
| Results reproducibility | NOT_RUN — partial local execution | Independent consumer and reported local SDK/policy results exist; final candidate browser/build/receipt acceptance remains pending. |

Formal sdk/build/browser remain **NOT_RUN**. Next action belongs to controller: integrate proposed @D14 tests, freeze candidate and complete applicable shared validation/receipts without promoting static or minimum-consumer evidence into browser PASS.
