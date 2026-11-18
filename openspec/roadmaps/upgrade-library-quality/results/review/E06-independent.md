# E06 independent review

2026-11-18, cwd `/home/lambert/githubRepos/lambert/ReactLoom`. Read fresh catalog retrieval, applicable AGENTS, agent/guide/metadata, actual declared source/declaration files, both tests, verification/local-validation, pinned README/provenance and browser proposal. Quality skill/references reused in session. Only report written; no entry/shared change, full author-suite repetition, browser/full checks or commit.

## Verdict and six dimensions

Spec/content PASS in static and independent SSR-consumer scope. No material defect found. Browser security/runtime acceptance remains pending controller, not inferred from SSR.

| Dimension | Status / evidence level | Evidence |
| --- | --- | --- |
| Technical accuracy | PASS — copied real render policy and actual ReactDOM SSR | New Markdown fixture independently proves GFM output, raw HTML dropping, strict URL/default contrast, image placeholder and external rel. Pre-sanitize injected script removed. |
| Explanation clear | PASS — static | Four different boundaries (skipHtml, sanitize, urlTransform replacement, final components) explicitly distinguished; score-like report labels are fixture content, not receipts. |
| Demo useful | NOT_RUN — SSR behavior verified, browser pending | Distinct basic React elements, business GFM report, advanced untrusted-input policies. Browser edits/network/execution markers not run here. |
| Source portable | PASS — actual copied strict compile and SSR consumer | Copied example.tsx/render-policy.mjs/.d.mts compiled strict with ESNext/Bundler/react-jsx/DOM, exit0. Exact dependency/React host requirements and lack of Provider/env/extra CSS clear. |
| Official sources reliable | PASS — live pinned original byte match and installed fields | Three installed versions/licenses match metadata/MIT. Fixed readme SHA matches upstream and local. Official demo homepage unknown is honest without Lab embedding confirmation. |
| Results reproducible | NOT_RUN — bounded SSR/compile evidence below, browser outstanding | No DOM/network/no-execution PASS claimed. Formal verification unchanged, no receipt created. |

## Independent copied consumer and commands

Python3 stdin orchestration created owned `/tmp/e06-independent-<random>`, copied the three required files, symlinked installed Lab node_modules for offline resolution, wrote tsconfig (strict/noEmit/skipLibCheck/jsx react-jsx/module ESNext/moduleResolution Bundler/target ES2022/lib ES2022+DOM/allowJs), then ran:

```sh
pnpm --filter @reactloom/library-lab exec tsc -p /tmp/e06-independent-<random>/tsconfig.json
node /tmp/e06-independent-<random>/consumer.mjs
```

Both exit0, strict compiler stdout empty; finally removed only owned consumer. No installs or workspace configuration changes.

New consumer imports actual react-markdown, remark-gfm, rehype-sanitize, React createElement/renderToStaticMarkup and copied markdownComponents/safeMarkdownURL. Markdown fixture:

```md
# Independent report

| Item | State |
| --- | --- |
| Orion | ready |

- [x] reviewed

[external](https://example.test/new) [anchor](#chapter-2) [local](/private) [mail](mailto:team@example.test)

![probe alt](https://example.test/independent.png)

<script>globalThis.consumerExecuted=true</script>

<img src=x onerror=alert(1)>
```

Render options exactly match UI: remarkPlugins=[remarkGfm], rehypePlugins=[rehypeSanitize], skipHtml=true, urlTransform=safeMarkdownURL, components=markdownComponents. Asserted table/Orion and disabled checked GFM checkbox, external target/rel, fragment anchor, no script/img/onerror/private href/mailto/image URL, and alt placeholder. Independently asserted defaultUrlTransform('/private') returns '/private' while safeMarkdownURL('/private') returns ''. A new pre-sanitize HAST plugin appended script text `untrustedMarker()`; rendered output had no marker.

Exact stdout:

```text
copied strict compilation exit 0

copied SSR consumer exit 0
copied actual render policy + ReactDOM SSR: GFM, HTML drop, strict/default URL contrast, image placeholder and external rel: PASS
sanitize removes preceding untrusted HAST script; final components remain separately constrained: PASS
SSR output only; no browser network/execution result asserted
```

Separate `node --input-type=module` source check asserted installed package versions match metadata and licenses MIT, fetched pinned raw `https://raw.githubusercontent.com/remarkjs/react-markdown/44d2e4a44b37461ab7778d6870c1a9eb36393ad2/readme.md`, asserted HTTP200 and crypto SHA256 equal local original/metadata. Exit0 exact output:

```text
three installed version/license fields match; upstream/local fixed README SHA b57882cd2b30ef3df905644e947c799709d82b10d4cb178346ce8b85d140c3b7
```

## Boundary findings and remaining action

- SDKs own Markdown/GFM AST and React element generation; strict HTTPS/fragment policy and a/img output are application choices, not default react-markdown guarantees. urlTransform replaces its default policy, independently confirmed via relative-URL contrast.
- skipHtml drops raw HTML nodes without rehype-raw. Sanitize filters preceding HAST; final custom components could create new unsafe DOM, so safe component code still matters. Actual a component only passes explicit safe props, rechecks href and adds external noopener/noreferrer; fragment links remain local. No AST props spread.
- img component returns a span from alt only and never creates an img element. SSR proves absence of img/preload output in this consumer, not that a browser sent no requests or executed no code. URL protocol checks alone are not a general content trust assertion.
- State holds source; preview derives from complete string and reparses per update. maxLength12000 is textarea UTF16/UI limit, not API limit or performance result. Native textarea composition may update preview during composition, accurately documented. No external subscriptions/timers/storage/Workers require cleanup.
- Browser proposal covers three independent goals, rel, disabled task controls, changed table cell, raw HTML/dangerous URLs, image request monitor, harmless execution marker, reset and unmount. These need controller execution; no actual browser assertion performed here.
- Pinned English original selection and repository metadata are consistent. Saved homepage200 headers have no explicit frame restriction; unknown is correct absent real Lab-origin iframe confirmation.

No source corrections requested. Stop writing; remaining runtime/browser/formal receipt work belongs to controller.
