# D18 independent review

2026-11-18, cwd `/home/lambert/githubRepos/lambert/ReactLoom`. Read retrieval, applicable AGENTS, metadata/agent/guide, all actual examples (five required migration files plus adapter), SDK/policy tests, verification/local-validation, provenance/headers and browser proposal. Quality skill/references reused in session. Only this report written; no entry/shared changes, full author-suite repetition, shared browser, broad checks or commits.

## Verdict and six dimensions

Spec/content PASS in static and independent Node Worker scope. No material source defect found. Browser quality acceptance pending controller; physical browser worker close cannot be inferred from Node.

| Dimension | Status / evidence level | Evidence |
| --- | --- | --- |
| Technical accuracy | PASS — real Comlink/Node Worker and static lifecycle | New consumer uses copied actual worker-api.ts, special-key/sparse-array/recovery behavior, transferable ownership and awaited callback order/release observed. Release request versus ACK accurately distinguished. |
| Explanation clear | PASS — static | Selection, RPC transport versus custom validation, transfer versus proxy, cancellation/epoch and local 5s timeout explained; fixture timing not performance claim. |
| Demo useful | NOT_RUN — Node API PASS, browser pending | Independent input RPC, remote rejection/retry, and transfer/callback/cancel goals. Browser module loading/CSP/controls remain unexecuted here. |
| Source portable | PASS — actual five-file copy and API execution | Required files copied to isolated consumer; guide specifies React/TS ES module/bundler, static worker URL, CSP and exact dependency. Node adapter test consumes same API, no Lab imports. Author targeted compiler evidence reviewed, not rerun. |
| Official source reliable | PASS — installed package plus live pinned raw bytes | Comlink4.4.2 installed license Apache-2.0; fixed LICENSE and README bytes independently match saved originals. Saved X-Frame-Options deny/frame-ancestors none supports blocked repository iframe. |
| Results reproducible | NOT_RUN — exact independent Node evidence, browser outstanding | Consumer command exit0/output below. Formal sdk/build/browser NOT_RUN retained; no receipt claims, no browser close result invented. |

## Independent consumer: command and exact result

Ran `node --input-type=module` with stdin from cwd above, exit0. Created owned mkdtemp d18-independent directory; copied example.tsx, worker.ts, worker-api.ts, session-policy.mjs/.d.mts, linked installed Lab node_modules for offline resolution, wrote consumer-worker.mjs adapter below. Node Worker started with execArgv:[] so stdin input-type flag was not inherited. Finally terminated any remaining worker and removed only owned directory. No UI/typecheck/build acceptance inferred from copying files.

Adapter:

```js
import {parentPort} from 'node:worker_threads';
import * as Comlink from 'comlink';
import nodeEndpoint from 'comlink/dist/esm/node-adapter.mjs';
import {api} from './worker-api.ts';
Comlink.expose(api,nodeEndpoint(parentPort));
```

Consumer assertion body (actual Comlink4.4.2 ESM and official nodeEndpoint imports):

```js
const remote=Comlink.wrap(nodeEndpoint(worker));
const result=await remote.summarize(['toString','fresh','__proto__','toString','constructor']);
assert.deepEqual(result.frequency,[{value:'toString',count:2},{value:'fresh',count:1},{value:'__proto__',count:1},{value:'constructor',count:1}]);
await assert.rejects(remote.summarize(new Array(2)),/Expected at most/);
await assert.rejects(remote.summarize(['ok',false]),/Expected at most/);
assert.equal((await remote.summarize(['recovered'])).count,1);
const bytes=new Uint8Array([3,7,11]);
assert.equal(await remote.sumBytes(Comlink.transfer(bytes,[bytes.buffer])),21);
assert.equal(bytes.byteLength,0);
const steps=[];let finalize;
const released=new Promise(resolve=>{finalize=resolve});
const callback=Comlink.proxy(async step=>{steps.push(step)});
callback[Comlink.finalizer]=finalize;
assert.equal(await remote.progress(2,callback),2);
assert.deepEqual(steps,[1,2]);
await Promise.race([released,new Promise((_,reject)=>setTimeout(()=>reject(Error('callback release not observed')),1000))]);
remote[Comlink.releaseProxy]();
await worker.terminate();
```

Same command independently read installed package.json version/license; fetched fixed raw README.md and LICENSE at commit fd4b52666b1ec62784f8b45cb1108c7e40bc481d, asserted HTTP200 and SHA256 equality with saved originals. Exact stdout:

```text
copied shared worker API RPC, special keys, sparse/invalid rejection and recovery: PASS
transferred buffer detached; proxy callbacks ordered and callback finalizer observed: PASS
release requested and physical Node Worker termination awaited: PASS
fixed README.md original sha256 cfd4281d28ea8268122ce3a885688c725f436fe12f4eb4f308242f130487af56
fixed LICENSE original sha256 bcf29b4fd3ec2cb5f9d40a0866da446f6da62170d2ccedf4aeca9cf9406dd20c
installed Comlink4.4.2 license Apache-2.0: PASS
```

The callback finalizer specifically establishes that the worker's normal progress finally sent a release which reached this callback endpoint. It does not transform the separate main remote releaseProxy void into a public ACK; termination is independently awaited in Node.

## Lifecycle and boundary audit

- Map and row-array return correctly treat inherited-property names as ordinary data. Array.from exposes sparse holes to validation. Limits10000/200UTF16, Uint8Array1MiB and progress1..20 are own business policy, not Comlink transport protection. Validation after cloning does not prevent sender allocation; guide explicitly says so.
- Worker progress accepts Remote<function & ProxyMarked>, awaits each callback and releases callback proxy in finally on normal/error paths. Force terminate cannot rely on finally collaboration; documented correctly.
- UI owns one session; ref existence blocks duplicate start. dispose removes ref before abort/release/terminate. Epoch increments on execute/cancel/unmount; result/callback checks guard updates, and old finally only disposes when epoch still current, protecting a newly created session.
- Error/messageerror/abort reject local failure Promise; Promise.race ends local wait.5s timeout applies across the whole task, is cleared in finally with listeners. It does not prove remote pending RPC resolves. Main abort is not passed across threads, cancellation physically terminates; release synchronous failure still reaches terminate via finally.
- Current Worker constructor failure has no created worker to release. Static module URL and own API are portable with documented bundler/CSP. No network, credential, storage or shared global worker cleanup.
- Browser proposal observes page worker creation and close externally, plus page.workers empty after success/error/cancel/unmount/tab exit, and cancellation text stability after300ms. It covers all three independent goals. Controller still must execute; no claims for missing-expose/CSP-failure browser injection beyond static error/timeout path.
- README English fallback matches fixed tree evidence. License checked from both installed package and actual fixed LICENSE, not inferred from prior notes. Blocked homepage has explicit saved deny/frame-none evidence and direct repository access.

No changes requested. Stop writing after this report; remaining browser execution belongs to controller.
