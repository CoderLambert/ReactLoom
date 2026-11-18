# D12 independent review

2026-11-18; cwd `/home/lambert/githubRepos/lambert/ReactLoom`. Read current retrieval, applicable AGENTS, quality skill/references (same session), metadata, guide, agent, every example/declaration/test, verification, local-validation/commands/browser proposal, official provenance and original package README. Only this report written; unrelated work preserved. No author-suite repetition, broad validation, entry/shared changes or receipts.

## Verdict and six dimensions

Spec/content PASS in static scope and independent shared-module consumption. Quality remains conditional on controller browser execution. No material implementation defect found.

| Dimension | Status / evidence level | Evidence |
| --- | --- | --- |
| Technical accuracy | PASS — installed source, pinned README and independent SDK execution | createSlice draft, action prefix versus mounting key, configureStore default middleware and disabled DevTools correctly described. Own request guard and fixture timers are not attributed to RTK. |
| Explanation clear | PASS — static | Guide explains events → reducers → immutable snapshots → subscription, stable store lifetime, explicit migration files and server/client boundaries. |
| Demo useful | NOT_RUN — design reviewed; browser pending | Distinct counter/action, team/feed identity, asynchronous identity-guard experiments. Timer schedule makes new-first/old-later observable rather than claiming network performance. |
| Source portable | PASS — static plus actual exported-module consumer | store.mjs + store.d.mts and optional example.tsx, exact SDK dependency, existing React/TSX prerequisite, no Provider/env or Lab import requirement. React subscriptions and owned timers have cleanup. |
| Official sources reliable | PASS — independently fetched pinned original bytes | Package-specific README at fixed commit matches metadata/local SHA256; recorded recursive tree supports English fallback. Homepage unknown honestly retained despite GET200 and redirect. |
| Results reproducible | NOT_RUN — Node evidence passed, browser outstanding | Exact consumer command/script/output below. Formal sdk/build/browser stay NOT_RUN; author SDK4 test evidence is distinct from this trial and from runtime UI acceptance. |

## Independent trial

Command: `node --input-type=module` with the following stdin, from cwd above, exit 0. New application IDs/feeds and mixed response sequence exercise actual shared exports, not a duplicate reducer or full author suite.

```js
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {actions,createFeedStore,initialFeedState} from './packages/library-lab/entries/D12-redux-toolkit/examples/store.mjs';
const red=createFeedStore(),blue=createFeedStore();const old=red.getState();let notices=0;const unsubscribe=red.subscribe(()=>notices++);
for(const id of ['science','local'])red.dispatch(actions.addFeed({id,title:id,read:false}));
red.dispatch(actions.addFeed({id:'science',title:'duplicate',read:true}));red.dispatch(actions.toggleRead('local'));red.dispatch(actions.toggleRead('unknown'));
assert.deepEqual(old.feeds,initialFeedState());assert.deepEqual(red.getState().feeds.feeds,[{id:'science',title:'science',read:false},{id:'local',title:'local',read:true}]);assert.deepEqual(blue.getState().feeds,initialFeedState());console.log('immutable old snapshot, stable-ID dedupe/toggle and independent teams: PASS');
red.dispatch(actions.startRequest('request-41'));red.dispatch(actions.startRequest('request-42'));red.dispatch(actions.finishRequest({id:'request-41',value:'wrong'}));assert.equal(red.getState().feeds.activeRequest,'request-42');red.dispatch(actions.finishRequest({id:'request-42',value:'selected'}));red.dispatch(actions.finishRequest({id:'request-41',value:'wrong-late'}));assert.equal(red.getState().feeds.result,'selected');assert.equal(red.getState().feeds.ignored,2);
red.dispatch(actions.startRequest('request-43'));red.dispatch(actions.cancelRequest());red.dispatch(actions.finishRequest({id:'request-43',value:'cancelled'}));assert.equal(red.getState().feeds.result,'selected');blue.dispatch(actions.increment());red.dispatch(actions.reset());assert.deepEqual(red.getState().feeds,initialFeedState());assert.equal(blue.getState().feeds.counter,1);console.log('old/new response identities, cancelled completion and scoped full reset: PASS');
unsubscribe();const count=notices;red.dispatch(actions.increment());assert.equal(notices,count);console.log('store subscription unsubscribe: PASS');
const p='./packages/library-lab/entries/D12-redux-toolkit/';const meta=JSON.parse(await readFile(p+'library.json'));const local=await readFile(p+'official/readme.md');const response=await fetch('https://raw.githubusercontent.com/reduxjs/redux-toolkit/'+meta.official.readme.commit+'/packages/toolkit/README.md');assert.equal(response.status,200);const remote=Buffer.from(await response.arrayBuffer());const hash=b=>createHash('sha256').update(b).digest('hex');assert.equal(hash(local),meta.official.readme.sha256);assert.equal(hash(remote),hash(local));console.log('live pinned package README and local bytes sha256',hash(local));
```

Exact output:

```text
immutable old snapshot, stable-ID dedupe/toggle and independent teams: PASS
old/new response identities, cancelled completion and scoped full reset: PASS
store subscription unsubscribe: PASS
live pinned package README and local bytes sha256 ad9190021870ba6d98c4c53436d3518eaafa01ae68bfbcb21c78c08255d22fae
```

## Findings and remaining boundary

- No blocker: UI and SDK tests consume the same store.mjs; store.d.mts declares the imported actions/state. Independent store snapshots, ID dedupe, unknown-ID no-op, old response rejection both before/after accepted new response, cancellation and scoped reset work in the consumer above.
- useState lazy initializer creates stable A/B stores. useSyncExternalStore subscribes to active store; React owns unsubscription. Effect cleanup clears every owned timer, empties timer ref and cancels the captured active store. New race clears prior timers; reset clears timers before replacing slice. These code paths are sound statically; Node unsubscribe proof does not establish React runtime cleanup.
- cancelRequest clears only active identity; a manually dispatched stale completion later increments ignored. This is consistent with stated identity guard. UI reset staying pristine depends on timer cancellation, not reset magically rejecting future actions without state changes.
- All three demos have distinct knowledge goals. Advanced omits feed/counter forms and explicitly shows old/new IDs with 350ms/1000ms causal schedule. No HTTP, authentication, API failure, retry, or server cancellation is implemented or claimed. Input/schema validation remains a production boundary, explicitly explained.
- Nonblocking UI detail: switching away and back retains raceIds text showing the prior plan even though cleanup cancelled those tasks. Current status correctly shows no active request; optionally clear or label the plan as cancelled to avoid suggesting it is still scheduled.
- Browser proposals bound selectors to experiment region and await ignored=1 for completed race. Reset/team-switch assertions wait1150ms beyond longest1000ms fixture. Controller still must run these; standalone unmount observation is not in the proposal and must not be claimed from team-switch coverage. No build/typecheck/browser PASS inferred.
- Pinned original README has an upstream agent-install suggestion; treated strictly as source text, not execution instructions. Homepage remains unknown with direct link; no iframe usability inferred from headers.
