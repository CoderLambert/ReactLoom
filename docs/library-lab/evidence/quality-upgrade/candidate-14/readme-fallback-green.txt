cwd=/home/lambert/githubRepos/lambert/ReactLoom
argv=["node", "--test", "packages/library-lab/tests/readme-html-fallback.test.mjs", "packages/library-lab/tests/document-utils.test.mjs", "packages/library-lab/tests/official-sources.test.mjs"]
✔ only safe HTTPS, fragments and same-entry relative files are accepted (2.577016ms)
✔ headings ignore fenced blocks and correctly preserve source line anchor (1.904857ms)
✔ Chinese anchors, inline code and duplicate headings exclude fenced content (0.185456ms)
✔ local example and test links map to real generated source files, not missing SPA fallbacks (1.112901ms)
✔ Markdown byte ceiling preserves split multibyte UTF-8 without trusting response length (15.285158ms)
✔ Markdown byte ceiling rejects oversized decoded body and cancels the reader (0.589845ms)
✔ Markdown rejects fallback HTML, non-2xx, invalid UTF-8 and absent response bodies (1.063219ms)
✔ Setext headings use source start lines and duplicate slugs match rendered anchors (0.49811ms)
✔ Fence-looking code text cannot expose hidden headings; indented/quoted code stays out of TOC (0.23718ms)
✔ Document-relative links reject scheme-relative or malformed Vite base paths (0.226204ms)
✔ official sources bind a snapshot to an immutable upstream file (1.033196ms)
✔ homepage checks distinguish unknown from blocked and validate safe addresses (0.199317ms)
✔ SheetJS canonical forge binds its actual README to the exact repository and commit (0.547338ms)
✔ README links resolve against the pinned upstream folder and local anchors remain local (0.168917ms)
✔ actual clsx README anchors target rendered headings including h4 (3.671984ms)
✔ scoped package README folders retain exact encoded upstream identity (0.240193ms)
✔ actual HTML-only Embla README stays readable as escaped original text (14.706931ms)
✔ HTML-only executable tags and handlers become literal source, never active elements (1.185385ms)
✔ ordinary and mixed Markdown retain their existing sanitize-and-skip policy (5.175127ms)
✔ code fences are ordinary Markdown and are never rewrapped as the entire source (1.970764ms)
✔ the guide path still drops HTML-only material rather than enabling the README fallback (0.936692ms)
✔ whitespace-only documents do not become empty code blocks (0.33772ms)
ℹ tests 22
ℹ suites 0
ℹ pass 22
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 135.134528

exit=0
