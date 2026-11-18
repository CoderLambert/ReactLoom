# E02 BlockNote — independent review

2026-11-18, cwd `/home/lambert/githubRepos/lambert/ReactLoom`. Review owns this report only; entry/shared files were not changed. Retrieval began at `LIBRARY_CATALOG.md:90`, then metadata/agent/guide, all displayed sources and declarations, verification/local-validation, policy tests, browser proposal, official source evidence and installed implementation. No full/shared checks or DOM SDK execution.

## Findings first

**No blocking defect found. Spec verdict: PASS for reviewed source/content and minimum integration. Overall quality: NOT_RUN pending real DOM/browser acceptance.** Pure Node policy execution below is not SDK execution.

1. **Low — make numbered-list limits more concrete.** Installed core `src/blocks/ListItem/NumberedListItem/block.ts:20` permits `props.start`; snapshot-policy rejects it. The default start is undefined and disappears from JSON, so ordinary numbered lists are not inherently broken. A document containing `{type:'numberedListItem',props:{start:5}}` is deliberately rejected by the independent policy consumer. This is consistent with the explicitly limited props contract and the guide's warning that default UI/schema is wider, but the phrase “five types” must not be read as complete support for every configuration of those types. Add a numbered-start example/negative test or intentionally support a bounded start property if product requirements need it. No silent data-loss path was found: save checks policy before overwriting the stored draft.
2. **Pending evidence — actual subscription cleanup.** Component source returns the real `editor.onChange` unsubscribe from its effect, and installed EventManager returns `this.on('onChange', wrapper)`, whose unsubscribe calls `off`. This confirms implementation statically. Current browser proposal proves DOM disappearance/remount only and explicitly disclaims destroy. It does not yet independently observe the application's specific subscription being removed. Keep source confirmation and runtime observation distinct; see bounded observation proposal below.
3. **IME scope remains limited.** Synthetic compositionstart/end tests exercise the application's ref guard; they do not establish actual OS input-method behavior, candidate selection or caret stability. The guide correctly leaves real IME acceptance pending. The code guards save/restore/insert; clearing the saved key does not replace the live document.

## Installed API and behavior audit

Actual packages: @blocknote/core/react/mantine **0.56.0, MPL-2.0**; @mantine/core/hooks **9.7.3, MIT**. BlockNote Mantine peer range includes ^9.0.2, and Mantine core requires hooks9.7.3 and React/DOM^19.2.0. Thus the documented React19.2 requirement matters; declaring React18 alone would be incomplete. The separately listed @mantine/utils6.0.22 is not directly imported by this example and is not evidence of a peer failure.

Installed `react/src/hooks/useCreateBlockNote.tsx` creates the editor through useMemo; it is not a controlled value hook and does not promise destroy. Installed React BlockNoteView detaches its ref via editor.unmount. Installed Mantine BlockNoteView uses existing MantineContext or supplies its own MantineProvider. The two declared CSS imports exist and compilation resolves them with Vite CSS declarations. onChange delegates to EventManager and returns an actual unsubscribe.

The example retains editor.document as source of truth, uses module-independent per-level keyed sessions, and does not replace the document on each input. Saving serializes and validates before setItem, preserving prior storage on validation failure. Restoration reads and fully validates before replaceBlocks, recursively removes persisted IDs and lets SDK allocate new ones. The type assertion is after an explicitly narrow runtime policy; it is not the validation itself. replaceBlocks internal exception atomicity is not promised. Read/write/remove Storage errors are caught, and only the entry's key is touched.

The five supported text block kinds, known props/styles and credential-free HTTPS links are a conservative subset. Default editing can create unsupported media/table/code/quote or differently configured content; saving that content fails visibly. This boundary is disclosed rather than pretending all default-editor JSON round-trips. Limits count JS UTF16 units, total nested blocks and bounded depth. This is a snapshot policy, not HTML sanitization or authorization.

## Independent portable consumer

Copied unchanged example.tsx, snapshot-policy.mjs and snapshot-policy.d.mts to `/tmp/e02-independent-qty_vcwi`. ESM package with installed dependency symlink, strict ES2022/ESNext/Bundler/react-jsx/noEmit config, Vite client CSS declarations, and a separate React consumer rendering `<BlockNoteExample level="advanced" />`. No fresh installation is claimed.

Command, cwd repository root:

`pnpm --filter @reactloom/library-lab exec tsc -p /tmp/e02-independent-qty_vcwi/tsconfig.json`

**Exit 0; output empty (no diagnostics).** This checks copied-source imports/types in a minimal browser-bundler setup. It does not load DOM SDK, render menus, build assets or validate CSS appearance.

Independent pure-policy command, same cwd:

`node /tmp/e02-independent-qty_vcwi/policy-consumer.mjs`

**Exit 0**, output:

```text
POLICY ONLY PASS: five default-text types; nested IDs removed; input unchanged; normalized round-trip stable; unsupported numbered start/table/credential link rejected; nested total limit enforced
```

This new consumer passed all five allowed text types together, including heading/check props and a nested styled HTTPS link; checked original input immutability, ID removal at both levels and normalization idempotence; rejected nondefault numbered start, table, credential-bearing URL and >100 total nested blocks. It imports only the policy, so **no SDK PASS** is inferred. Author's 5/5 policy tests remain separately reported; no DOM SDK execution was performed by either this independent trial or those tests.

## Bounded browser cleanup observation

A reliable source-matched path exists for runtime observation without adding production APIs. Installed useCreateBlockNote sets `window.ProseMirror` to Tiptap; installed BlockNoteEditor stamps its instance on `tiptap.schema.cached.blockNoteEditor`. These are dev/source-specific handles, not a stable product-facing public contract: browser tests should fail closed if absent rather than silently skip.

From that BlockNote instance, subscribe using public `onUnmount` and check it fires when View detaches; retain/call the test's own unsubscribe afterwards. Tiptap's public unmount can also be observed; installed implementation destroys its ProseMirror view and detaches its DOM reference while allowing later remount. This supports view unmount, not full BlockNote destroy.

For dynamic unsubscribe evidence, one option is to wrap the obtained editor prototype's public onChange before a subsequent mount, recording each returned unsubscribe wrapper and whether invoked, then remount a new instance and unmount it. Scope instrumentation to that trial and restore the prototype afterwards. If all captured subscriptions close, it supplies stronger outside-component evidence; do not claim a specifically identified application callback if internal registrations cannot be distinguished. Alternatively retain the exact own-effect source proof and public onUnmount runtime observation as separate evidence levels. Tiptap.off alone is insufficient: the relevant unsubscribe belongs to BlockNote EventManager.off, not directly Tiptap's event emitter. No such browser probe was run during this review. Controller confirmed it will add a bounded public onUnmount probe using this fail-closed handle; runtime outcome remains pending and should not be promoted to own-callback or destroy proof.

## Official source and license verification

Independently fetched immutable upstream README.md at `TypeCellOS/BlockNote@8e0485caef54abe9cad6b84fa66505e0398acb79`. Raw bytes equal official/readme.md; recomputed SHA256 **bd1237b3f568a463fc23afab18583d63362b2e745ac049d17a37971111c08ce8** matches metadata. Also independently fetched fixed LICENSE.txt; bytes equal official/license.txt. The text explicitly applies MPL-2.0 except packages/xl-* / @blocknote/xl-* (GPL-3.0 or commercial licensing); this example does not import XL. The installed three BlockNote package fields independently agree with MPL-2.0. This verifies provenance text, not a legal opinion about a future product.

Saved source-evidence.json lists actual pinned README candidates without a Chinese root translation; English fallback is justified. Its homepage observation has status200 and concrete response-header fields but no frame restriction, without Lab-origin browser confirmation. unknown is appropriately conservative. No fresh iframe test was performed, and CORS `*` is not embedding permission.

## Six dimensions

| Dimension | Status / evidence level | Basis |
| --- | --- | --- |
| Technical accuracy | PASS — installed source/types plus pure-policy checks | Actual API/Provider/peer/CSS/lifecycle contracts match; default schema vs limited persistence is explicit. |
| Explanation clarity | PASS — static independent review | Selection, editor ownership, limited snapshot contract, errors and complete migration are concrete. |
| Demo usefulness | NOT_RUN — actual DOM/browser pending | Three useful goals exist; editing/menu, insert/save/restore/IME and lifetime runtime observations still need controller execution. |
| Source portability | PASS — isolated strict copied-source compilation | Three required files, declared dependencies and browser bundler/CSS setup compile; no DOM/runtime assertion. |
| Official-source reliability | PASS — upstream byte/hash/license comparison and saved headers | Pinned provenance verifies, XL exception disclosed, homepage remains unknown. |
| Results reproducibility | NOT_RUN — policy/compiler only complete | Exact commands/exits/output above; no real DOM SDK, browser appearance/IME or runtime unsubscribe proof yet. |

Formal sdk/build/browser remain **NOT_RUN**. Controller's forthcoming actual browser records must close the DOM acceptance gap; do not substitute policy execution, static source or component disappearance for SDK operation or cleanup observations.
