"""Run one explicitly supplied scoped command and preserve its raw output."""
import datetime
import json
from pathlib import Path
import subprocess
import sys

entry = Path(__file__).resolve().parents[1]
root = entry.parents[3]
log = entry / 'validation' / sys.argv[1]
argv = sys.argv[2:]
started = datetime.datetime.now(datetime.timezone.utc).isoformat()
result = subprocess.run(argv, cwd=root, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
header = {'cwd': str(root), 'argv': argv, 'utc': started, 'exit': result.returncode}
log.write_text(json.dumps(header, ensure_ascii=False) + '\n' + result.stdout)
print(log.relative_to(root), 'exit', result.returncode)
print(result.stdout)
raise SystemExit(result.returncode)
