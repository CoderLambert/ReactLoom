# E08 independent review

2026-11-18, cwd `/home/lambert/githubRepos/lambert/ReactLoom`. Read fresh retrieval, applicable AGENTS, metadata/agent/guide, actual full source/declarations, SDK/policy tests, verification/local-validation, original source evidence and browser proposal. Quality skill/references reused. Only report written, no entry/shared changes, full suite repetition, shared browser/full checks or commits.

## Verdict and six dimensions

Spec/content PASS in static and independent Node pipeline scope. No material source defect found. Browser isolation/no-request/no-execution acceptance remains pending controller.

| Dimension | Status / level | Evidence |
| --- | --- | --- |
| Technical accuracy | PASS — actual shared sanitizer and SDK | New multichannel HTML consumer retains allowed structure and strips script/event/navigation/media/form channels. UTF8 budget and textarea UTF16 distinction reproduced. |
| Explanation clear | PASS — static | HAST parse→strict sanitize→stringify, content loss, opaque origin versus remote host, CSP/sandbox supplementary boundaries, migration and errors explained. |
| Demo useful | NOT_RUN — pipeline verified, browser pending | Structure retention, business navigation tradeoff, multibyte/error and hostile-channel preview goals differ. Actual sandbox/network behavior not established by Node. |
| Source portable | PASS — copied strict compile and consumer | Five required files copied, strict ESNext/Bundler/react-jsx/DOM compile exit0; same shared schema/pipeline executed. Exact dependency/TextEncoder/React requirements clear. |
| Official sources reliable | PASS — live original byte match/installed fields | rehype13.0.2 and sanitizer6.0.0 installed MIT verified; fixed package readme upstream/local SHA matches. Saved GitHub deny/frame-ancestors none supports blocked iframe. |
| Results reproducible | NOT_RUN — bounded local evidence below, browser outstanding | Node output/config evidence only, no browser/XSS/network/receipt PASS inferred. |

## Independent copied pipeline consumer

Python3 stdin orchestration created owned `/tmp/e08-independent-<random>`, copied example.tsx, sanitize-policy.mjs/.d.mts and input-policy.mjs/.d.mts, linked existing Lab node_modules for offline resolution and wrote strict/noEmit/skipLibCheck/ESNext/Bundler/react-jsx/ES2022+DOM/allowJs tsconfig. Ran:

```sh
pnpm --filter @reactloom/library-lab exec tsc -p /tmp/e08-independent-<random>/tsconfig.json
node /tmp/e08-independent-<random>/consumer.mjs
```

Both exit0, compiler stdout empty. Removed only owned temporary consumer in finally; no install/workspace config changes.

Consumer imported actual rehype/rehype-sanitize plus copied sanitizeHTML/strictHtmlSchema/previewDocument/blockedCsp/assertHTMLBudget. New HTML fixture “Orion bulletin” included h3/em/ol/li and source anchor title, plus HTTPS href/ping/target, script marker, CSS URL, image onerror, video poster/source, meta refresh, base, form/input, svg onload and iframe. Compared sanitizeHTML result byte-for-byte to real rehype().use(rehypeSanitize,strictHtmlSchema).processSync of that input. Asserted allowed h3/em/list and inert a title retained; no script/style/image/media/meta/base/form/input/svg/iframe/event/nav/source URL tokens survived.

Budget assertions accepted `'界'.repeat(8333)+'x'` exactly25000 UTF8 bytes, rejected8334 chars25002 bytes and ASCII25001. previewDocument output starts with fixed CSP meta, not untrusted source before policy.

Exact stdout:

```text
copied strict compilation exit 0

copied pipeline consumer exit 0
new HTML through shared pipeline + actual rehype schema: formatting retained; script/event/navigation/media/form channels stripped: PASS
UTF8 25000-byte boundary accepted, multibyte25002 and ASCII25001 rejected; preview fixed CSP present: PASS
Node proves output/config only; browser opaque origin/no execution/no requests remain NOT_RUN
```

Separate `node --input-type=module` source check read both installed package.json version/license fields, fetched `https://raw.githubusercontent.com/rehypejs/rehype/06fd4dc9b13538ece27bce1999a85d396a646817/packages/rehype/readme.md`, asserted HTTP200 and crypto SHA256 matching local original/metadata. Exit0 exact stdout:

```text
installed13.0.2/6.0.0 MIT; fixed original README SHA b7f74a9ed8b1343a0eab1a8243c18526ff5fd4739b0856356e6fa9aa84e8aeb1
```

## Boundary and lifecycle audit

- strictHtmlSchema is the actual UI and SDK schema, not a parallel test config. Attributes only allow a.title; href is excluded independently of protocols.href=[], so HTTPS navigation is also removed. Media tags absent, dangerous containers strip descendants, parser normalization is not preservation guarantee.
- Input budget is self-authored policy before parsing, not a rehype performance/security limit.25000 bytes is about24.4KiB, not25KiB/25000 characters. Pure assertHTMLBudget boundary checks are policy evidence; new pipeline processing itself is genuine SDK evidence, counted separately.
- previewDocument is intentionally a trust boundary accepting already sanitized output; UI passes sanitizeHTML success only. No unsafe later concatenation in actual path. Empty sandbox lacks scripts/same-origin and generates opaque origin. Fixed CSP rejects external/script/connection/image/frame/form/base channels; neither CSP nor sandbox excuses unsafe schema/sink changes.
- Parent cannot read opaque-origin frame DOM; browser automation frameLocator is separate privileged inspection. Do not add allow-same-origin to make parent test access easier. Parent execution marker alone is not universal proof of no frame execution because opaque-origin access itself blocks parent writes; proposal also checks absence of executable nodes and fixed CSP, and appropriately needs runtime interpretation.
- Processing is synchronous local work, so no async stale-result race. Failure sets output=null and removes prior pre/frame, reset/level changes clear prior output/error. No timer/Worker/listener/objectURL/storage connection to release; iframe unmount removes only own browsing context. Large synchronous CPU work remains a production concern.
- Browser proposal covers all three goals, actual frame content, empty sandbox, parent contentDocument null, stripped channels, CSP, unique request monitoring, multibyte failure removing old frame, recovery/reset/unmount. Controller must run it; no actual browser no-request/no-execution claim made here.
- Fixed English package README selection and MIT installed fields consistent; saved GitHub XFO deny/CSP frame-none evidence justifies blocked homepage and direct link fallback.

No source corrections requested. Stop writing; browser/formal receipt work remains controller responsibility.
