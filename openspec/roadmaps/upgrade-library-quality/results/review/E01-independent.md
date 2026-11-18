# E01 independent review

2026-11-18; cwd `/home/lambert/githubRepos/lambert/ReactLoom`. Fresh retrieval, applicable AGENTS, guide/agent/metadata, every declared source/declaration, both tests, verification/local-validation, original README/provenance and browser proposal reviewed. Quality skill/references reused. Only this report written; no entry/shared changes, author suite repetition, browser/full checks or commit.

## Material finding: heading default bypass (CLOSED after delta)

P2 — `examples/snapshot-policy.mjs`, checkAttributes/parseTiptapSnapshot: heading level is validated only when the input includes a level key. `{type:'heading'}` and `{type:'heading',attrs:{}}` pass the policy and actual configured Schema.check(), which supplies default level1. Both can reach setContent and contradict the documented “only headings2/3” restore contract.

Independent command `node --input-type=module` imported getSchema from installed @tiptap/react/dist/index.js plus actual createExtensions and parseTiptapSnapshot, then parsed/check/toJSON for each missing-level form. Exit0, exact output:

```text
{"type":"doc","content":[{"type":"heading","attrs":{"level":1}}]}
{"type":"doc","content":[{"type":"heading","attrs":{"level":1}}]}
```

Recommended correction: require heading.attrs to be a record with explicit level2/3 before Schema conversion, and add missing/empty attrs negative tests. Config heading.levels controls commands/rendering/parsing behavior, not a universal default-attribute validation boundary. Finding sent immediately to controller; reviewer did not modify author files.

## Six dimensions and verdict

Spec/content PASS after independently verified delta correction; quality remains conditional on controller browser acceptance. Original finding below retained as history.

| Dimension | Status / evidence level | Evidence |
| --- | --- | --- |
| Technical accuracy | PASS after delta — independent actual Schema reproduction | Policy now rejects missing/empty heading attrs before default level1 can enter; explicit2/3 remain valid. Original defect and correction documented below. |
| Explanation clear | PASS — static, with explicit caveat above | Headless model, Editor ownership, policy→Schema→mutation, session scope, storage-policy versus DOM, HTML boundaries and complete migration are understandable. The heading assertion needs implementation alignment. |
| Demo useful | NOT_RUN — actual Schema consumer PASS, DOM pending | Three distinct editing/undo, session draft, JSON rejection/import goals; browser commands/formatting lifecycle not run by reviewer. |
| Source portable | PASS — independent copied strict compile and consumer | Copied six required files, declarations resolve; strict TypeScript ESNext/Bundler/react-jsx/DOM compile exit0. Copied config consumed actual getSchema. |
| Official sources reliable | PASS — installed package/live original comparison | Three installed packages3.32.0 MIT; fixed React package README upstream/local SHA matches. Saved homepage X-Frame-Options SAMEORIGIN justifies blocked cross-origin iframe. |
| Results reproducible | NOT_RUN — independent local evidence recorded, browser pending | Commands/output below; no DOM Editor created or false browser/receipt PASS. Heading counterexample reproducible. |

## Independent copied migration/consumer

Ran Python3 stdin orchestration from cwd above. Created `/tmp/e01-independent-<random>`, copied example.tsx, editor-config.ts, snapshot-policy.mjs/.d.mts, snapshot-storage.mjs/.d.mts, linked installed Lab node_modules for offline resolution. Wrote tsconfig with strict/noEmit/skipLibCheck/jsx react-jsx/module ESNext/moduleResolution Bundler/target ES2022/lib ES2022+DOM/allowJs, include copied TSX/TS/MTS. Ran:

```sh
pnpm --filter @reactloom/library-lab exec tsc -p /tmp/e01-independent-<random>/tsconfig.json
node /tmp/e01-independent-<random>/consumer.mjs
```

Both exit0; compiler stdout empty. Removed only owned directory in finally. No dependency/install/host modifications.

Consumer imported actual copied createExtensions, actual getSchema and copied parseTiptapSnapshot/storage functions. New valid fixture: heading3 “Independent heading”, paragraph “Reference” with HTTPS link `https://example.test/consumer`. Parser→nodeFromJSON→check passed. A local apply counter increased only after validation; nested heading inside paragraph, explicit heading1 and HTTP link each threw before increment. Heading2 “Second” also passed. Storage used a Map-backed adapter and throwing setItem, explicitly pure policy evidence, unrelated key preserved.

Exact stdout:

```text
strict copied compilation exit 0

copied schema consumer exit 0
copied actual config + getSchema: new heading3/HTTPS document accepted; invalid tree/heading1/HTTP rejected before apply: PASS
heading2 accepted; storage helper roundtrip/error stays separate policy evidence: PASS
```

Key consumer assertions:

```js
const schema=getSchema(createExtensions());
const consume=raw=>{
 const node=schema.nodeFromJSON(parseTiptapSnapshot(raw));
 node.check();applied++;return node.toJSON();
};
assert.equal(consume(JSON.stringify(valid)).content[0].attrs.level,3);
// Explicit heading1, HTTP link, paragraph containing heading each assert.throws(consume).
assert.equal(applied,1);
```

Separate `node --input-type=module` source-check script read actual installed package.json for react/pm/starter-kit and asserted version3.32.0/licenseMIT. It fetched pinned raw packages/react/README.md at commit388e722df0b36f5ac7d63cbd8b2354d43794360d, asserted HTTP200 and crypto SHA256 matching local/metadata. Exit0 exact stdout:

```text
installed three packages3.32.0 MIT; pinned upstream/local README SHA cc6e56529352492fc0a03db3b33b26e9e5de0dc2502f39af6f7b5939dc5f6793
```

## Other findings and remaining boundary

- applyDocument performs schema.nodeFromJSON.check before setContent(errorOnInvalidContent:true); structural invalid allowed nodes are rejected before editor mutation, as independently observed without a DOM Editor. Header default bypass is a missing policy requirement rather than missing Schema.check call.
- StarterKit Link configuration rejects nonHTTPS, credentials and whitespace/backslash; snapshot policy independently rejects unsafe href. No imported HTML rendering. Helpers touch own DRAFT_KEY only; Storage exception tests do not establish actual browser quota behavior.
- useEditor installed src/useEditor.ts schedules destroy and ultimately calls currentEditor.destroy, accounting for React lifecycle reuse. Own update callback identity is shared by on/off in effect. Browser proposal captures actual editor from DOM, observes isDestroyed, counts own off calls, inspects callback clearance; this is stronger than DOM disappearance but still unexecuted here.
- immediatelyRender:false, React client DOM requirements, exact extension versions and all helper/declaration files are included. No Provider/env/network/Worker required. Chinese real IME/manual acceptance correctly left open.
- Browser proposal covers all three goals, restoration baseline preservation and actual hook cleanup. Add the two missing-level cases after correction; no browser PASS inferred from strict compilation or Schema tests.

Stop after report; author/controller owns delta correction and browser execution.


## Delta closure (2026-11-18)

Controller added a mandatory heading attrs-record and explicit level2/3 check before checkAttributes; reviewer inspected the exact branch. Independently ran only `node --input-type=module` targeted counterexample (cwd unchanged), exit0. Actual getSchema(createExtensions()) still fills missing/empty attrs with level1, demonstrating why policy is needed; parseTiptapSnapshot now throws for both. Explicit levels2 and3 still pass policy and schema.check. Exact stdout:

```text
delta: missing/empty heading attrs rejected by policy; default schema still supplies1; explicit2/3 remain valid: PASS
```

Closed P2. No full suite repeated. Controller reports red-before/final SDK3+policy5 and browser negative cases added; those are controller evidence, not claimed as independently rerun here. Browser runtime remains pending in this review.
