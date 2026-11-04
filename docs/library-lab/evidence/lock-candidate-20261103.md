# 2026-11-03 Library Lab lock candidate: executed CI evidence, not acceptance

## Source and exact execution
- Source branch `fix/library-lab-p0-sdk-browser-20261103`, head `07704c6ece7e01afd32c706dda434d05807de5e0`, PR #90, base `feat/library-lab`.
- [GitHub Actions run 41679144302](https://github.com/CoderLambert/ReactLoom/actions/runs/41679144302) used allocated GitHub-hosted runner(s) and produced real step logs. This is a **change** from #12's historical runner-allocation failures.
- `catalogue` job 126067781580: success. Node platform logic passed; **this is not SDK/build/browser proof**.
- `lock-candidate` job 126067962200: success. Actual command was `pnpm install --lockfile-only --no-frozen-lockfile --ignore-scripts` (exit code 0); final registry resolution reached 3160 package entries.
- Uploaded candidate: [artifact 13251518230](https://github.com/CoderLambert/ReactLoom/actions/runs/41679144302/artifacts/13251518230), `library-lab-lock-candidate-1bb78e1722f28becf3217429b20e2596ea874e76`. This artifact is **not committed as the root lockfile**.
- `runtime` job 126067962372: **FAIL** at `pnpm install --frozen-lockfile --ignore-scripts` with `ERR_PNPM_OUTDATED_LOCKFILE`; the checked-in lockfile lacks the `packages/library-lab` importer and 165 declared specifiers. Typecheck, build, SDK, Chromium steps were skipped.
- Independent monorepo CI run [41679144713](https://github.com/CoderLambert/ReactLoom/actions/runs/41679144713) also failed its install steps; there is no evidence yet of a complete CI build on this PR.

## Artifact contents inspected (not independently installed)
Downloaded artifact ZIP and parsed its `pnpm-lock.yaml`:
- Lock format `9.0`; 9 importers, 3160 package resolution records, 3255 snapshots.
- Candidate `packages/library-lab` importer present with 136 dependencies and 29 devDependencies.
- Critical pins: `echarts 6.1.0`, `@floating-ui/react 0.27.20`, `react-hook-form 7.89.0`, `p-limit 7.3.3`, `monaco-editor 0.57.0`, `msw 3.0.3`, `@playwright/test 1.64.0`.
- ZIP member `pnpm-lock.yaml` size: 1,330,877 bytes; SHA-256: `1d255c4858effcb7967cead058f46358a8dc31d646804616b133683bef144b1d`. This checksum binds this reviewed artifact only; it is **not** a software integrity or licence certification.
- Every one of the 3160 package resolution records contains an `integrity` or equivalent source metadata field. This is a parse-level observation, not a tarball verification or frozen-install PASS.

## Gate status and handoff
- **PASS (limited):** runner allocation, catalogue Node platform checks, registry-based candidate lock resolution.
- **FAIL:** frozen install of currently committed root `pnpm-lock.yaml`.
- **NOT_RUN/BLOCKED:** full Lab typecheck/build, real A01/B17/C01/D03/E05/F11 SDK and browser suites, licence/peer review on downloaded install.
- **Single-owner boundary:** #86 designates shared root lockfile to Core & CI; this Library Lab P0 repair branch must not edit it. Coordinate application/review of artifact 13251518230 on `feat/library-lab`, not `main`, and do not invent integrity or bypass the frozen gate.
- Once the actual root lockfile is reviewed and committed by its owner, rerun normal CI on that commit, prove frozen install and build, then inspect SDK/Chromium logs and record fingerprint-bound evidence before changing `verification.json`.
