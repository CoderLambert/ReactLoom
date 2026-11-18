from pathlib import Path
import subprocess, sys, shlex

root = Path(__file__).resolve().parent
lab = root.parents[2]
checks = {
    'sdk': ['node', '--test', 'entries/A10-tldraw/tests/sdk.test.mjs'],
    'policy': ['node', '--test', 'entries/A10-tldraw/tests/snapshot-policy.test.mts'],
    'typecheck': ['pnpm', 'exec', 'tsc', '--ignoreConfig', '--noEmit', '--target', 'es2022', '--module', 'esnext', '--moduleResolution', 'bundler', '--jsx', 'react-jsx', '--strict', '--skipLibCheck', '--esModuleInterop', '--types', 'vite/client,node', 'entries/A10-tldraw/examples/demo.tsx'],
    'biome': ['pnpm', 'exec', 'biome', 'check', '--write', 'entries/A10-tldraw/examples', 'entries/A10-tldraw/tests', 'entries/A10-tldraw/library.json', 'entries/A10-tldraw/verification.json', 'entries/A10-tldraw/official/source-audit.json', 'entries/A10-tldraw/official/homepage-response.json', 'entries/A10-tldraw/validation/check-entry.mjs'],
    'metadata': ['node', 'entries/A10-tldraw/validation/check-entry.mjs'],
    'diff-check': ['git', 'diff', '--check', '--', 'entries/A10-tldraw'],
}
for name in sys.argv[1:]:
    cmd = checks[name]
    p = subprocess.run(cmd, cwd=lab, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=60)
    log = f'cwd: {lab}\ncommand: {shlex.join(cmd)}\nexit: {p.returncode}\n\n{p.stdout}'
    (root / f'{name}.txt').write_text(log)
    print(name, 'exit:', p.returncode, '\n', p.stdout[-4500:])
