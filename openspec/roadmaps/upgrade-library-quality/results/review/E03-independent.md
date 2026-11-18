# E03 independent review

2026-11-18, cwd `/home/lambert/githubRepos/lambert/ReactLoom`. Read retrieval, applicable AGENTS, metadata/agent/guide, five actual migration files plus adapter, SDK/policy tests, verification/local-validation, provenance and browser proposal. Same-session quality skill/references reused. Only report written; no entry/shared changes, full author-suite repetition, shared browser/full checks or commits.

## Verdict and six dimensions

Spec/content PASS in static and independent no-DOM consumer scope. No material defect found. DOM quality acceptance remains pending controller, not inferred from state tests.

| Dimension | Status / level | Evidence |
| --- | --- | --- |
| Technical accuracy | PASS — real no-DOM Lexical consumer plus installed source | Copied state-operations handles new italic text, discrete update/read, legal restore and invalid protocol rejection without applying. Actual parse failure reaches throwing onError; update unregister verified. |
| Explanation clear | PASS — static | State ownership, read/update, finite version1 protocol, parse-partial-state error boundary, legacy Composer, selection/history/IME separation and complete migration clear. |
| Demo useful | NOT_RUN — state behavior independently verified, DOM pending | Three independent input-state, session JSON, selection-format/history goals; no-DOM trial cannot establish selection, HistoryPlugin or browser typing. |
| Source portable | PASS — copied strict compilation and actual operations | Five actual files copied including styles.css; strict TS ESNext/Bundler/react-jsx/DOM+vite/client compile exit0. Exact two dependencies and React/TS/CSS host requirements stated. |
| Official sources reliable | PASS — installed fields and live raw-byte match | Both installed0.52.0 MIT, fixed LICENSE and README match saved bytes. Homepage unknown correctly retained without Lab embedding confirmation. |
| Results reproducible | NOT_RUN — independent local evidence below, browser outstanding | Compile/no-DOM output recorded; DOM root/selection/history/nativeIME unrun here; formal verification unchanged. |

## Independent migration/consumer commands

Python3 stdin orchestration created owned `/tmp/e03-independent-<random>`, copied example.tsx/state-operations.ts/snapshot-policy.mjs/.d.mts/styles.css, linked existing Lab node_modules for offline resolution, wrote tsconfig (strict/noEmit/skipLibCheck/ESNext/Bundler/react-jsx/ES2022+DOM/types vite/client/allowJs), then ran:

```sh
pnpm --filter @reactloom/library-lab exec tsc -p /tmp/e03-independent-<random>/tsconfig.json
node /tmp/e03-independent-<random>/consumer.mjs
```

Both exit0, compiler stdout empty. Finally removed only owned temporary consumer; no install/config mutations.

Consumer imported actual createEditor/$getRoot/$createParagraphNode/$createTextNode and copied resetDocument/restoreSnapshot/assertLexicalSnapshot. New fixture “Orion report” toggled italic (format2) in discrete update, read committed text, serialized through shared policy, reset then restored. Rejected paragraph-inside-paragraph and text.format='italic' without changing previous committed JSON. Direct SDK unknown-node parse bypassed policy to verify error reached rethrowing onError and committed state stayed unchanged. Registered update observer fired before off, not after.

Core executed assertion sequence:

```js
const editor=createEditor({namespace:'independent-E03',onError(error){errors++;throw error}});
resetDocument(editor);
editor.update(()=>{
 $getRoot().clear().append($createParagraphNode().append($createTextNode('Orion report').toggleFormat('italic')));
},{discrete:true});
assert.equal(editor.getEditorState().read(()=>$getRoot().getTextContent()),'Orion report');
const saved=assertLexicalSnapshot(JSON.stringify(editor.getEditorState().toJSON()));
assert.equal(JSON.parse(saved).root.children[0].children[0].format,2);
resetDocument(editor);restoreSnapshot(editor,saved);
assert.equal(editor.getEditorState().read(()=>$getRoot().getTextContent()),'Orion report');
```

Exact stdout:

```text
copied strict compilation exit 0

copied real no-DOM consumer exit 0
shared operations with new italic text: discrete update/read and valid restore; nested/format rejection preserves committed state: PASS
actual parse error reaches rethrowing onError without applying partial state; update unregister stops notices: PASS
no DOM, HistoryPlugin, selection or IME evidence claimed
```

Separate `node --input-type=module` source verification read installed lexical/@lexical/react package.json and asserted0.52.0/MIT, fetched fixed `https://raw.githubusercontent.com/facebook/lexical/b2af316af8ab328a86ff27885f2ce94f18dce571/{README.md,LICENSE}`, asserted HTTP200 and SHA256 equality to saved originals. Exit0 output:

```text
pinned README.md original SHA c9c358b87dfb3b0bdda8735cfdadba1ea5c086ada74f2288e8e762e3a8f7778b
pinned LICENSE original SHA da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93
installed lexical/@lexical/react0.52.0 MIT fields: PASS
```

## API/cleanup and protocol audit

- Core editor state APIs perform actual immutable read/update/parse/set. root→paragraph→text/linebreak/tab/version1 whitelist and types/format/size checks are self-authored policy, not Lexical's universal JSON schema. Save also checks policy. DOM paste can create unsupported styles and be rejected at save, explicitly disclosed.
- restoreSnapshot validates before parse and before set; parsed.isEmpty protects empty state. Config onError rethrows, preserving synchronous failure instead of accepting SDK partial parsing. This does not promise arbitrary DOM/set failures atomically roll back, correctly qualified.
- Installed LexicalComposer source explicitly deprecated in0.52, initialConfig consumed in useMemo initial creation. Changing object identity is not a recreation guarantee; key=level resets, matching guide.
- Installed RootListener type permits a returned cleanup; registerRootListener invokes it before transition/unregister. Own composition DOM listeners are removed via that path, with composing reset. OnChangePlugin returns registerUpdateListener teardown; callback uses state.read. ContentEditable cleanup calls setRootElement(null). No invented editor.destroy.
- IME guard checks own ref plus editor.isComposing before save/restore/reset/format/history. Toolbar mousedown preservation is appropriate for selection; actual command effect/History ordering/native IME remains browser/manual work. CSS bold theme file is included in migration and strict compile.
- Browser proposal obtains matching-version root __lexicalEditor only as test probe, uses public getRootElement/registerRootListener to observe null, then removes its own observer. It does not equate DOM disappearance with destroy. Storage failures only target own key; policy/fake exceptions are distinct from browser runtime evidence.
- README/English fallback, MIT original and homepage unknown are honest and scoped. No server/authorization/HTML sanitizer/extension-model migration capability invented.

No corrections requested. Stop writing; controller owns actual DOM/browser/formal receipt execution.
