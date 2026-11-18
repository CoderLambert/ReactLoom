# D20 independent review

2026-11-18; cwd `/home/lambert/githubRepos/lambert/ReactLoom`. Read fresh retrieval, applicable AGENTS, metadata/guide/agent, all runtime/helper/declaration/UI/test sources, verification/local-validation, pinned README/provenance and browser proposal. Quality skill/references reused from this session. Only this report written. No entry/shared changes, author suite repetition, shared browser, broad validation, commits or subagents.

## Verdict

Spec/content PASS in static and independent Node-consumer scope. Quality conditional on controller browser run. No blocking defect found. Suitable for an authorized in-memory corpus needing token/prefix/fuzzy retrieval; not a server ACL, professional Chinese segmentation or persistence layer. SDK owns inverted index/search/autoSuggest and scoring; scope helper, immutable replacement and fixture groups are application policy.

| Dimension | Status / level | Evidence |
| --- | --- | --- |
| Technical accuracy | PASS — installed SDK and independent copied consumer | 7.2.0/MIT verified; actual exported buildMiniIndex yields higher title scores, prefix/fuzzy behavior, same scoped index for search/suggestion, replacement invalidates old term. Default Chinese boundary reproduced. |
| Explanation clear | PASS — static | Guide distinguishes fields/storeFields, title boost, greater-score direction, prefix/fuzzy, pre-index scope and server authorization. Complete migration and performance/Chinese limitations are explicit. |
| Demo useful | NOT_RUN — independent model PASS, browser pending | Three goals: full text/scoring, category+IME, suggestions/tolerance+update. UI operations and proposal align, but Node does not establish UI behavior. |
| Source portable | PASS — copied runtime and helpers executed | Actual runtime.mjs/.d.mts and scope-policy.mjs/.d.mts copied to temporary consumer; one existing installed dependency linked for offline test. Exact pnpm install, React/TS bundler requirements and optional adapter stated. |
| Official source reliable | PASS — independent byte match and metadata | Fixed upstream/local README hashes match; installed version/license match. Saved homepage GET200 headers lack explicit framing ban, unknown is honest without Lab browser confirmation. |
| Results reproducible | NOT_RUN — independent consumer evidence below, browser outstanding | Raw command/output and exit below. Formal verification remains NOT_RUN, SDK4 author tests not rerun and not used as UI receipt. |

## Independent migration/consumer trial

Ran `node --input-type=module` with stdin from cwd above, exit0. Script copied the four actual runtime/helper/declaration files into a fresh `mkdtemp('/tmp/d20-consumer-…')`, symlinked its node_modules to this workspace's installed Lab node_modules (no install/config mutation), dynamically imported the copied .mjs files, and removed only its owned temporary directory in finally. Type declarations were migrated and statically checked for export/type alignment; no tsc/build run claimed.

Exact assertions executed after those imports:

```js
const docs=[
 {id:'1',title:'Galaxy Suspense guide',summary:'orbital systems',group:'技术'},
 {id:'body',title:'Orbit report',summary:'Galaxy',group:'技术'},
 {id:'outside',title:'Galactic ledger',summary:'market',group:'产品'},
];
const scoped=scopeSearchDocuments(docs,'技术'),index=buildMiniIndex(scoped);
const exact=index.search('Galaxy',{prefix:false,fuzzy:false});
assert.deepEqual(exact.map(x=>x.id),['1','body']);
assert.ok(exact[0].score>exact[1].score);
assert.equal(index.search('Gala',{prefix:true,fuzzy:false}).length,2);
assert.equal(index.search('Galxxy',{prefix:false,fuzzy:false}).length,0);
assert.equal(index.search('Galxxy',{prefix:false,fuzzy:0.2}).length,2);
assert.equal(index.autoSuggest('Galac',{prefix:true,fuzzy:false}).length,0);
assert.ok(buildMiniIndex(docs).autoSuggest('Galac',{prefix:true,fuzzy:false}).length);
const next=buildMiniIndex(updateFirstDocument(docs));
assert.equal(next.search('Suspense',{prefix:false,fuzzy:false}).length,0);
assert.equal(next.search('Streaming',{prefix:false,fuzzy:false})[0].id,'1');
assert.equal(docs[0].title,'Galaxy Suspense guide');
const cn=buildMiniIndex([{id:'cn',title:'中文检索实验',summary:'',group:'技术'}]);
assert.equal(cn.search('检索',{prefix:false,fuzzy:false}).length,0);
assert.equal(cn.search('中文检索实验',{prefix:false,fuzzy:false}).length,1);
```

Same Node command fetched `https://raw.githubusercontent.com/lucaong/minisearch/3d239d1c3ae7aef1bf5d8945dd7b5f0709f646f5/README.md`, asserted HTTP200, compared upstream/local SHA256 with metadata via node:crypto, and asserted installed package version7.2.0/licenseMIT. Exact stdout:

```text
copied runtime/helpers: title score > summary; prefix/fuzzy; search+suggest scoped: PASS
immutable replacement removes old token, adds new token: PASS
default tokenizer continuous Chinese limitation: PASS
owned temporary consumer removed: PASS
installed 7.2.0 MIT; upstream/local pinned README SHA256 e1b4c36f42a3a0a35f5ef66c617f3d018409732ea9c3c66e01036e6c85313b27
```

## Detailed findings and remaining action

- Actual UI uses scopeSearchDocuments before buildMiniIndex/addAll. search and autoSuggest share that index; search filter checks byId before slice20, suggestion slice3 occurs after scoped indexing. No unauthorized full index hidden by JSX. UI category still cannot authorize browser data, clearly stated.
- updateFirstDocument changes id1 in a new array, and every searchable old Suspense field disappears. React memo dependencies cause a new index. Independent old fixture remains unchanged; declaring shallow copies honestly avoids an unsupported deep immutability claim.
- IME code uses composition ref on submit and prevents Enter default during ref/isComposing/keyCode229. This is a reasonable implementation; actual OS input-method acceptance remains pending. Result/suggestion content uses React text nodes, no HTML injection.
- Local indexes/memos/state need no external unsubscribe or timer cleanup. There is no Worker, network request, persistence or privileged resource. Unmount releases references; browser proposal checks remount restores seed.
- Official source commit and original English bytes are pinned. No official Chinese README recorded in fixed tree; language en matches actual original. Homepage unknown and direct link are appropriate; no embed PASS inferred from HTTP200.
- Nonblocking browser coverage gap: proposal primarily visits advanced. Add brief basic summary-field query (CLI) and business category+empty-query checks to exercise their independent goals explicitly. Existing advanced proposal strongly covers shared scope/IME, fuzzy, suggestions and old/new token behavior, including remount. This is an acceptance recommendation, not a source defect.
- No code changes requested. Controller browser run remains required for Demo usefulness/results runtime PASS; no receipt/build/browser state promoted here.
