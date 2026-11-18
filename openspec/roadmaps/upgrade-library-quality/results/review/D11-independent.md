# D11 Jotai — independent review and consumer trial

Reviewed 2026-11-18 at `/home/lambert/githubRepos/lambert/ReactLoom`, against current stable working-tree entry (not historical CI). Only this report was written. Retrieval: `LIBRARY_CATALOG.md:78` → library.json → agent.md → guide.md → all six displayed source files → verification.json/local-validation.md → tests and proposed browser suite. Applied current root/package/entry AGENTS and library-lab-quality rules/references. D04 was not revisited; no shared changes, generation, full suites, commits or browser execution.

**Spec verdict: PASS for reviewed teaching/source and independent minimum consumer. Overall quality verdict: NOT_RUN pending browser/integrated validation.** No material implementation defect found. A source-level or minimum-consumer result is not a formal SDK/build/browser receipt.

## Findings

- **Low: stale evidence notes in verification.json.** sdk says dependencies were unavailable for execution, build implies the lock remains to be resolved. Actual installed Jotai is 3.0.1; local-validation records 3 SDK and 4 policy tests, and the root importer exists. Keep NOT_RUN formal statuses, but describe missing current matching receipts/integrated build instead. Do not erase the boundary between local logs and official acceptance.
- **Pending controller dependency:** `validation/browser.spec.ts` is a proposed suite, not executed evidence. Integrate @D11 and validate count/derived, selected checkbox, session replacement A-reset/B-preserved and unmount/remount on the frozen candidate. Shared build/typecheck/browser remain NOT_RUN here.

## Teaching, integration and ownership audit

The entry explains when fine-grained independent state and derived values justify Jotai, and redirects remote cache to Query, mutually exclusive workflows to XState, and authorization to the server. Three scenarios have distinct objectives: count/double, stable-ID write plus derived unread, and two isolated stores plus keyed session replacement. Fixture data is explicitly local; there is no remote auth, persisted login, network or cache-clearing claim.

The actual UI and SDK tests import the same `workspace-atoms.mjs`, rather than redefining atoms in tests. Module-level atom references are stable; values live per Store. `TenantWorkspace` creates a store per keyed mount and supplies it explicitly to Provider. A increments session key, B retains its own key/store. Replacing A unmounts its Provider but does not claim to clear Query, I/O or tokens. Installed `jotai/dist/react/Provider.js` confirms explicit store use, fallback default-store behavior and implicit per-Provider store creation. The guide correctly discloses basic still reads story atoms even though it hides them.

`toggleReadAtom` delegates to actual `story-policy.mjs`; input shape and all IDs are checked before map/write. Duplicate/nonempty identity and boolean-read rules fail closed; unknown IDs preserve the array reference; updating by business ID survives reorder. Policy validation is custom business logic, not SDK schema. JSX keys also use the stable story ID. Source declarations match exports and are listed for all demos.

Migration is complete: React 18+, TypeScript 5.5+, ESM and `pnpm add jotai@3.0.1`; copy example.tsx plus workspace-atoms.mjs/.d.mts and story-policy.mjs/.d.mts. demo.tsx is an optional Lab re-export. No CSS, account, special configuration or Lab internal import is necessary. Store subscriptions created manually require unsubscribe; React-mounted subscriptions belong to the Provider subtree. Mutable fixture arrays should continue to be treated immutably as shown.

## Independent minimum consumer: actual commands and outputs

Copied the five documented migration files into `/tmp/d11-independent-duzd8jcj`, with an ESM package and node_modules symlink to installed Lab dependencies (no fresh install claim). Added a strict ES2022/NodeNext/react-jsx TypeScript consumer rendering `<JotaiWorkshop level="advanced" />`. Both commands below ran from the repository root and exited **0**:

`pnpm --filter @reactloom/library-lab exec tsc -p /tmp/d11-independent-duzd8jcj/tsconfig.json`

Output: no diagnostics. This is isolated copied-source compilation, not the application build or browser mounting.

`node /tmp/d11-independent-duzd8jcj/trial.mjs`

Output:

```text
PASS copied actual atoms: derived=12; reordered stable-ID target only; unread A=1/B=2; unknown no-op; duplicate fail-closed; fresh session defaults
```

The consumer imported real `createStore` from installed Jotai 3.0.1 and the copied unchanged production `workspace-atoms.mjs`. It set count A=6 and asserted derived A=12/B=0; reordered the list before writing rss-1 and checked only that ID changed; asserted unread A=1/B=2 and immutable original data; verified missing ID identity; inserted duplicate IDs and asserted TypeError with the invalid snapshot unchanged; then created a replacement Store and asserted count0/unread2. This independently exercises the documented integration and identity boundary without duplicating the full test suite. It does not simulate React unmount or establish browser acceptance.

Author evidence reviewed separately: local-validation reports SDK 3/3 and policy 4/4. The SDK suite genuinely imports real createStore and the UI's shared atoms. Policy assertions are correctly reported separately. No formal receipt was promoted from either result.

## Official source audit

Independently downloaded the immutable upstream `README.md` at commit `6abd0ae3365e02ab432fba4b6e8e6f00aafbf508` with Python urllib. Raw bytes exactly match `official/readme.md`; recomputed SHA256 `ac1282016db1e46c4186f650e1afcf4f08b84cd6bb0fb9a9bd3512d86540a347` matches metadata. Stored complete recursive tree has the same SHA, truncated=false, root README.md and example/website READMEs, with no Chinese root translation; English root README is an appropriate official fallback. Installed package confirms 3.0.1, ESM and TypeScript >=5.5 typing export requirements.

Saved homepage headers show HTTP200 without X-Frame-Options or frame-ancestors. `unknown` is correct: absence of headers is insufficient for allowed, and there is no actual Lab-origin browser content confirmation. This review did not perform a fresh homepage or iframe browser test. The metadata preserves official direct URL and observation date.

## Six quality statuses

| Dimension | Status and evidence level | Basis |
| --- | --- | --- |
| Technical accuracy | PASS — source, installed SDK and independent real consumer | Shared atoms, derived/write behavior, keyed store model and fail-closed identity checks agree with source. |
| Explanation clarity | PASS — static content review | Concrete selection, configuration/value distinction, operation outcomes and complete migration instructions. |
| Demo usefulness | NOT_RUN — design/source reviewed | Three distinct real SDK scenarios; actual UI interactions and lifecycle await @D11 execution. |
| Source portability | PASS — isolated strict compilation and real Store consumer | All five documented files compile together; stable-ID reordered input and two Store isolation executed successfully. |
| Official source reliability | PASS — upstream byte/hash comparison plus recorded headers | Immutable official README verified; homepage accurately unknown, not allowed. |
| Results reproducibility | NOT_RUN — partial execution available | Independent consumer passes and author SDK/policy results exist; final candidate integrated/browser/receipt evidence remains missing. |

Formal sdk/build/browser remain **NOT_RUN**. Controller should finish frozen-candidate shared acceptance and report exact evidence; this independent review does not authorize broader entry/shared changes.
