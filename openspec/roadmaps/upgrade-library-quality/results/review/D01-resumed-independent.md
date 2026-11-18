# D01 resumed independent review — 2026-11-18

Scope: independent read-only entry review and new minimal SDK consumer; only this report written. Workspace `/home/lambert/githubRepos/lambert/ReactLoom`, dirty multi-author candidate preserved. Read Lab/entry instructions, coordination, roadmap design/start-here and library-lab-quality references. No generation, build, typecheck, author-suite rerun or browser execution.

## Verdict

Spec/content design PASS: exactly one declared basic experiment runs normalization → sorting → deduplication → grouping → pagination using the actual four SDK exports. No confirmed blocking content/source defect. Quality acceptance remains **review_pending**, because live React interaction is NOT_RUN by this reviewer and controller browser evidence is pending. Formal sdk/build/browser remain NOT_RUN in verification.json; local execution is not a receipt.

| Dimension | Status and evidence |
| --- | --- |
| Technical accuracy | PASS — pinned 1.52.0 sources orderBy.ts.txt / uniqBy.ts.txt / groupBy.ts.txt / chunk.ts.txt match described contracts; independent execution of actual pipeline imported es-toolkit/array successfully. Ordering before uniqBy retains latest normalized identity; exact ties retain first arrival. |
| Explanation | PASS — guide distinguishes custom validation/URL rules from SDK operations, explains the observable five stages and ordering counterexample, and scopes chunk away from request scheduling. |
| Useful demo | NOT_RUN at browser level — static UI offers editable JSON, page sizes, bad-row injection, reset, intermediate outputs and alert/old-output clearing. Independent pure-pipeline experiment passed, but does not prove click/render behavior. |
| Migratable source | PASS at source/SDK level — guide names example.tsx, pipeline.mjs and pipeline.d.mts, React/JSX/ESM prerequisites and exact pnpm dependency; demo.tsx is optional adapter. No hidden Lab imports, CSS/assets/env/plugins or async resources. Standalone React fixture build NOT_RUN. |
| Official sources | PASS — live GET of immutable official Chinese README equals saved 4098 bytes and metadata SHA256; tag evidence maps v1.52.0 to commit 32f4c8fb33828ad6512064ba84b0fdd8fda966a3. README source path remains upstream README-zh_hans.md while platform language enum is zh-CN. Website remains correctly unknown despite saved HTTP 200; no iframe allowance claimed. |
| Reproducibility | NOT_RUN for complete browser result — independent SDK trial below exit 0, author local validation records 2/2 and package Biome separately, formal verification stays NOT_RUN. |

## Retrieval and metadata

First retrieval observed the already-reported unsupported README language metadata; did not infer source failure. After author re-STABLE notification, reran `node packages/library-lab/scripts/find-library.mjs --id D01 --agent`: exit 0, D01 identity, agent text, demo path and verification path returned. The retrieval blocker is resolved in reviewed candidate.

Read library.json → agent/guide → all four declared sources → verification.json, plus pinned upstream API snapshots, tag and local validation. README live check used Python urllib to GET `https://raw.githubusercontent.com/toss/es-toolkit/32f4c8fb33828ad6512064ba84b0fdd8fda966a3/README-zh_hans.md`, compared bytes and SHA256 with official/readme.md and metadata. Exit 0:

```json
{"bytes":4098,"remoteEqualsLocal":true,"sha256":"57e526f31e4471cd234cc6aeca69fb83c9e469c010713ddef6dc9f8776ac101d","metadataDigestMatches":true}
```

## New independent consumer

Exact invocation: `node --input-type=module` with this stdin, cwd repository root; exit 0. This is a new consumer with distinct data rather than rerunning author tests.

```js
import assert from 'node:assert/strict';
import {makeDigest,canonicalUrl,seed} from './packages/library-lab/entries/D01-es-toolkit/examples/pipeline.mjs';
const rows = [
{url:'https://a.test/post?id=1&utm_source=x#h',title:' old ',source:'official',publishedAt:'2026-01-01'},
{url:'https://a.test/post?UTM_SOURCE=y&id=1',title:' new ',source:'community',publishedAt:'2026-02-01'},
{url:'https://a.test/post?id=2',title:'second',source:'alien',publishedAt:'2026-01-15'},
{url:'javascript:alert(1)',title:'bad',publishedAt:'2026-03-01'},
null,{url:'https://a.test',title:' ',publishedAt:'2026-01-01'},
{url:'https://a.test',title:'bad date',publishedAt:'nope'},
];
const result=makeDigest(rows,1);
assert.equal(result.accepted.length,3); assert.deepEqual(result.articles.map(x=>x.title),['new','second']);
assert.equal(result.articles[0].url,'https://a.test/post?id=1');
assert.deepEqual(Object.fromEntries(Object.entries(result.bySource).map(([k,v])=>[k,v.length])),{official:0,community:1,other:1});
assert.deepEqual(result.pages.map(x=>x.length),[1,1]); assert.deepEqual(result.rejected.map(x=>x.index),[3,4,5,6]);
assert.throws(()=>makeDigest(rows,0),RangeError);assert.throws(()=>makeDigest(rows,1.5),RangeError);
assert.deepEqual(makeDigest([],2).pages,[]);
const tie=makeDigest([rows[1],{...rows[1],title:'later arrival'}],2);assert.equal(tie.articles[0].title,'new');
const defaultResult=makeDigest(seed,2);assert.deepEqual(defaultResult.pages.map(x=>x.length),[2,2]);assert.equal(defaultResult.articles[0].title,'Release notes');
assert.equal(canonicalUrl('https://a.test/p?z=2&id=43&utm_x=y#hash'),'https://a.test/p?id=43&z=2');
console.log(JSON.stringify({accepted:result.accepted.length,titles:result.articles.map(x=>x.title),groups:Object.fromEntries(Object.entries(result.bySource).map(([k,v])=>[k,v.length])),pages:result.pages.map(x=>x.length),rejected:result.rejected.map(x=>x.index),defaultPages:defaultResult.pages.map(x=>x.length),invalidPageSize:'RangeError',tie:'first arrival',assertions:'PASS'}));
```

Exact stdout:

```json
{"accepted":3,"titles":["new","second"],"groups":{"official":0,"community":1,"other":1},"pages":[1,1],"rejected":[3,4,5,6],"defaultPages":[2,2],"invalidPageSize":"RangeError","tie":"first arrival","assertions":"PASS"}
```

The retained `new` record proves canonicalization and sort-before-dedup affect selection; changed source proves grouping occurs after dedup. Unknown source becomes other, id=2 survives, invalid rows are isolated with original indices, empty input and illegal page sizes behave as documented. Source-level UI output keys match guide (`normalized`, `sorted`, `unique`, `groupSizes`, `pages`, `rejected`). Guide boundaries cover Date.parse permissiveness, unknown query preservation, URL identity/redirect/tenant limitations, memory pagination, absent concurrency/cache and production schema needs. Remaining validation: controller's actual editor/bad JSON/reset/page-size browser flow and shared production build, each recorded separately.
