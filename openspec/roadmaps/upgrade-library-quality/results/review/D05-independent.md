# D05 independent review

Reviewed 2026-11-18 in `/home/lambert/githubRepos/lambert/ReactLoom`. Scope: current dirty D05 entry only; no entry/shared changes, no full author-suite repetition, generation, build or typecheck. Read applicable root/package/entry instructions, coordination, implementation/repair documents, quality skill and its three references, retrieval result, metadata, agent, guide, all example/declaration files, tests, verification, local-validation, browser proposal, provenance and original README. Existing unrelated edits preserved.

## Verdict

Spec/content: PASS for static requirements and independent Node consumption. Quality: conditional, browser-dependent dimensions remain NOT_RUN. No blocking implementation defect found. Three source-backed experiments teach distinct concepts: editable string/Number addition; bounded invoice calculation and invalidation; fixed half-cent modes and line-versus-unit rounding. Advanced is explicitly a fixed observable experiment, not a second invoice form or configurable tax engine.

| Dimension | Status / evidence level | Evidence |
| --- | --- | --- |
| Technical accuracy | PASS — pinned documentation, installed SDK and independent execution | Installed decimal.js 10.6.0; significant-digit precision, new result objects, clone isolation and explicit output formatting match pinned README/types. Independent invoice values and hostile global-config mutation passed. |
| Explanation clear | PASS — static review | Guide explains string → Decimal → declared rounding → string, precision versus decimal places, clone versus set, input-policy versus SDK capability and service-authoritative pricing. |
| Demo useful | NOT_RUN — static design sound, SDK independently consumed | Three distinct goals and observable outputs; actual React editing/recovery and scenario selection need controller browser run. |
| Source portable | PASS — static review plus Node imports | Four .mjs/.d.mts calculation files, exact install command, optional React TSX and Lab-only adapter described. No Lab imports, resource cleanup or hidden provider requirements. |
| Official sources reliable | PASS — independent pinned-byte comparison | Live pinned raw README GET 200 matches metadata/local SHA256 `80c51b8ffd2a690cf51b571490d098c8a8175094a6c86f3e8e37716e49314d5e`. Provenance stores tag/commit/root tree and English selection. Homepage honestly unknown, GET 200 not iframe acceptance. |
| Results reproducible | NOT_RUN — independent SDK evidence below, browser pending | New exported-function trials exit 0. Formal verification stays NOT_RUN; no receipt created and browser interaction not independently executed. |

## Independent trial (exit 0)

cwd: `/home/lambert/githubRepos/lambert/ReactLoom`. Executed `node --input-type=module` with stdin script below; this consumes documented exports with new values, rather than rerunning author's six SDK plus three policy tests.

```js
import assert from 'node:assert/strict';
import Decimal from './packages/library-lab/node_modules/decimal.js/decimal.mjs';
import { calculateInvoice, roundingContrast } from './packages/library-lab/entries/D05-decimal-js/examples/invoice.mjs';
const result = calculateInvoice({unitPrice:'2.345',quantity:'7',taxPercent:'12.5'});
assert.deepEqual(result,{subtotal:'16.42',tax:'2.05',total:'18.47'});
console.log('new invoice',JSON.stringify(result));
const before={precision:Decimal.precision,rounding:Decimal.rounding};
Decimal.set({precision:2,rounding:Decimal.ROUND_DOWN});
assert.deepEqual(calculateInvoice({unitPrice:'4.5678',quantity:'11',taxPercent:'3.25'}),{subtotal:'50.25',tax:'1.63',total:'51.88'});
assert.equal(roundingContrast().extendedLine,'1.01');
Decimal.set(before);
console.log('global config mutation does not alter already cloned invoice constructors: PASS');
assert.throws(()=>calculateInvoice({unitPrice:'2.345',quantity:'7',taxPercent:'100.01'}),/100/);
assert.deepEqual(calculateInvoice({unitPrice:'2.345',quantity:'7',taxPercent:'0'}),{subtotal:'16.42',tax:'0.00',total:'16.42'});
console.log('invalid tax rejects; corrected tax recovers: PASS');
```

Exact output:

```text
new invoice {"subtotal":"16.42","tax":"2.05","total":"18.47"}
global config mutation does not alter already cloned invoice constructors: PASS
invalid tax rejects; corrected tax recovers: PASS
```

Additional independent Node crypto/readFile comparison exit 0 printed:

```text
README sha256 80c51b8ffd2a690cf51b571490d098c8a8175094a6c86f3e8e37716e49314d5e
```

Separate `node --input-type=module` live fetch of `https://raw.githubusercontent.com/MikeMcl/decimal.js/1a6e845004b29a3b7dcef78fe92b8d786634f4e2/README.md`, hashing raw response bytes with node:crypto, exit 0:

```text
Pinned upstream README GET 200 sha256 80c51b8ffd2a690cf51b571490d098c8a8175094a6c86f3e8e37716e49314d5e
```

## Behavioral/code findings and remaining action

- `example.tsx` updateInput clears result and previous error for all three business fields; calculate failure also clears result. Addition errors remove outputs and recovery recomputes. This is static evidence, not browser acceptance.
- `invoice.mjs` calculates unit × quantity before rounding subtotal, then taxes that rounded subtotal and rounds tax. `roundingContrast` independently compares rounding the unit first. For 0.335 × 3, 1.01 versus 1.02 is implemented as described. Fixture tax rate/sequence is explicitly disclaimed as jurisdiction-independent teaching policy.
- No missing production integration prerequisite found. Strings retained through policy validation, calculation and DTO output; Number exists only in labeled basic comparison. Maximum accepted input magnitude is comfortably below 28 significant digits for these operations.
- Nonblocking documentation nit: local-validation calls the combined result “SDK9/9” even though its parenthetical correctly distinguishes six SDK and three policy tests. Prefer “combined 9/9: SDK6 + policy3” to keep tally labels unambiguous.
- Controller should execute the existing three browser proposals and additionally confirm editing tax alone invalidates an existing result. No browser PASS, build PASS or receipt PASS is inferred here. Homepage iframe usability remains unknown by design; preserve direct official link.
