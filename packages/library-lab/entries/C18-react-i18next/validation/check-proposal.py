"""Check this complete proposal only; remove transient TypeScript in finally."""
from pathlib import Path
import subprocess
import tempfile
import sys
entry = Path(__file__).resolve().parents[1]
package = entry.parents[1]
with tempfile.TemporaryDirectory(prefix='.proposal-check-', dir=entry/'validation') as temporary:
    file = Path(temporary)/'proposal.ts'
    file.write_bytes((entry/'validation/browser-proposal.txt').read_bytes())
    for command in [
        ['pnpm','exec','biome','check','--write',str(file)],
        ['pnpm','exec','tsc','--ignoreConfig','--noEmit','--target','es2022','--module','esnext','--moduleResolution','bundler','--strict','--skipLibCheck','--esModuleInterop','--types','node',str(file)],
    ]:
        print('cwd',package,'argv',command,flush=True)
        result = subprocess.run(command,cwd=package)
        if result.returncode:sys.exit(result.returncode)
    (entry/'validation/browser-proposal.txt').write_bytes(file.read_bytes())
