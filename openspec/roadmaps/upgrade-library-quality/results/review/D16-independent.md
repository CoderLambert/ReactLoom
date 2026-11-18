# D16 independent review

2026-11-18; cwd `/home/lambert/githubRepos/lambert/ReactLoom`. Read current applicable AGENTS, same-session quality skill/references, retrieval, metadata/guide/agent, all five recipe/module sources, both tests, verification, local-validation, raw CLI/SDK/policy logs, command records, artifact hashes, provenance/README and browser proposal. Scope strictly Node isolated generation; no registration, host modification, entry/shared changes, full-suite/three-recipe rerun or broad validation. Only this report written; unrelated edits preserved.

## Verdict and six scoped dimensions

Spec PASS; quality PASS for the declared Node build workshop. Browser offline/install/activate/update/CacheStorage behavior is NOT_RUN and outside current scope. Website recipe display remains pending controller and cannot support offline claims. No material defect found.

| Dimension | Status / evidence level | Evidence |
| --- | --- | --- |
| Technical accuracy | PASS — actual generated artifacts, SDK consumer and pinned source | getManifest/generateSW separation, revision list, narrow NetworkFirst matcher, navigation shell semantics and registration boundary accurately explained. |
| Explanation clear | PASS — static | Selection, file → manifest → generated worker → later browser lifecycle, fixture limits, migration and cleanup are explicit. |
| Demo useful | PASS — Node generation scope | Three actual CLI records exit0 with different observable artifacts: precache, runtime route, navigation shell. Independent new tiny fixture consumes options and SDK below. No browser execution claimed. |
| Source portable | PASS — actual module consumer plus static review | Exact Node>=20/workbox-build7.4.1 dependency; .mjs workshop/cache policy/needed entry files, no React/env/config; owned mkdtemp cleanup and retained-output instructions explicit. |
| Official sources reliable | PASS — independent upstream bytes/hash plus saved CSP | Fixed package README hash independently matches; short original legitimately links docs. Recorded Chrome Chinese page frame-ancestors permits self/Google analytics origin only, so blocked Lab embedding is justified; direct link retained. |
| Results reproducible | PASS — bounded Node layer only | Raw argv/cwd/exits, 18 artifact byte hashes verified, independent generation command exit0. Browser offline and lifecycle NOT_RUN; formal verification remains NOT_RUN without receipt. |

## Independent minimum consumer trial

Command `node --input-type=module` with stdin below; exit0. Uses new own fixture and exported workboxOptions, not runWorkshop or the author's three recipes/tests. Generates and inspects files only, never registers SW.

```js
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import workbox from './packages/library-lab/node_modules/workbox-build/build/index.js';
import {workboxOptions} from './packages/library-lab/entries/D16-workbox/examples/workshop.mjs';
const scratch=await mkdtemp(path.join(tmpdir(),'d16-independent-'));
try {
  await mkdir(path.join(scratch,'private'));
  for(const [name,body] of Object.entries({'index.html':'<h1>Independent</h1>','offline.html':'<h1>Own shell</h1>','consumer.js':'console.log("independent")','private/secret.js':'throw Error("fixture")'})) await writeFile(path.join(scratch,name),body);
  const options=workboxOptions(scratch,'advanced');
  const {globDirectory,globPatterns,globIgnores,globFollow,maximumFileSizeToCacheInBytes}=options;
  const manifest=await workbox.getManifest({globDirectory,globPatterns,globIgnores,globFollow,maximumFileSizeToCacheInBytes});
  assert.deepEqual(manifest.warnings,[]);
  assert.deepEqual(manifest.manifestEntries.map(x=>x.url).sort(),['consumer.js','index.html','offline.html']);
  assert.ok(manifest.manifestEntries.every(x=>x.revision));
  const generated=await workbox.generateSW(options);
  assert.deepEqual(generated.warnings,[]);assert.equal(generated.count,3);
  const sw=await readFile(options.swDest,'utf8');
  for(const token of ['consumer.js','NetworkFirst','NavigationRoute','createHandlerBoundToURL("offline.html")','networkTimeoutSeconds:2','statuses:[200]','maxEntries:12','maxAgeSeconds:3600'])assert.ok(sw.includes(token),token);
  assert.ok(!sw.includes('secret.js'));assert.ok(!sw.includes('navigator.serviceWorker.register'));
  assert.equal(options.navigateFallbackDenylist,undefined);
  console.log('new fixture manifest consumer.js/index.html/offline.html; revisions present; private excluded: PASS');
  console.log('generated count 3; NetworkFirst policy and unfiltered navigation shell serialized: PASS');
} finally {
  await rm(scratch,{recursive:true,force:true});
  console.log('only owned disposable fixture removed; no SW registered: PASS');
}
```

The same command then used node:crypto SHA256 over every commands.json artifacts[].path and asserted equality with its recorded sha256 (18 files); fetched the pinned raw upstream package README, asserted HTTP200 and hash equality against metadata and local original. Exact complete output:

```text
new fixture manifest consumer.js/index.html/offline.html; revisions present; private excluded: PASS
generated count 3; NetworkFirst policy and unfiltered navigation shell serialized: PASS
only owned disposable fixture removed; no SW registered: PASS
retained artifact hashes verified: 18
pinned upstream and local README sha256 fcffa1e6d7fbbe1cff9aefba38a5b99a0ed51851126462a1e0884a2d1708af86
```

Upstream verified URL: `https://raw.githubusercontent.com/GoogleChrome/workbox/62b9d8ba8eb3c1a2ab8aac9d84c90cda7865d6a3/packages/workbox-build/README.md`.

## Findings and acceptance boundary

- ISOLATED_SCOPE is a directory/declared output marker. It does not establish registered scope. No example calls registration or copies artifacts into Lab root. Guide correctly says skipWaiting/clientsClaim false are not scope guarantees; SKIP_WAITING message handling can still exist.
- Advanced generateSW creates NavigationRoute bound to offline.html, so eligible navigations use a precached shell, not just network failures. No navigation allow/deny lists. globIgnores excludes private files from precache, not private URLs from navigation handling or authorization. This is accurately taught.
- Runtime matcher is self-contained and serializable: GET, omit credentials, exact HTTPS origin/path and no Authorization/Cookie/Proxy-Authorization; query variations accepted. SDK generation proves serialization/configuration, not anonymous HTTP behavior, cached response hits, failure/timeout cancellation or backend public-data safety.
- Warnings, count mismatch and empty worker fail; errors propagate nonzero. Default runWorkshop finally deletes only its owned scratch; CLI keepOutput true retains artifacts even on failure, explicitly documented. No global cache clearing or other SW unregister path.
- All three actual CLI logs show registrationExecuted=false, three precache resources and310bytes; retained files match recorded hashes. SDK3 and policy3 are separated. swBytes is correctly distinguished from runtime and network bytes. No false application-build receipt.
- Browser proposal is display-only, checking the declared command and copy button. It neither proves offline behavior nor requires registering SW. Controller may execute it within current scope; offline/lifecycle work requires a separate product origin and separately authorized scope, not a Lab registration.
- No blocking or nonblocking content change required. Preserve current explicit boundaries when editing summary/title: the phrase offline fallback must remain explained as the advanced navigation shell configuration, with runtime untested.
