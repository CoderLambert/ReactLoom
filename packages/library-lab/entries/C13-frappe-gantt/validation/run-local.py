"""Run one scoped command and append its actual cwd/argv/exit/log receipt."""
import datetime
import json
from pathlib import Path
import subprocess
import sys

ENTRY = Path(__file__).resolve().parents[1]
PACKAGE = ENTRY.parents[1]
label, *command = sys.argv[1:]
started = datetime.datetime.now(datetime.timezone.utc).isoformat()
result = subprocess.run(command, cwd=PACKAGE, text=True, capture_output=True)
log = f'validation/{label}.txt'
(ENTRY / log).write_text(
    f'cwd: {PACKAGE}\nargv: {command!r}\nstartedAt: {started}\nexit: {result.returncode}\n'
    + result.stdout + result.stderr
)
records = ENTRY / 'validation/local-runs.json'
runs = json.loads(records.read_text()) if records.exists() else []
runs.append({'cwd': str(PACKAGE), 'argv': command, 'startedAt': started,
             'exitCode': result.returncode, 'log': log})
records.write_text(json.dumps(runs, ensure_ascii=False, indent=2) + '\n')
print(result.stdout + result.stderr, end='')
print(f'{label}: exit {result.returncode}; {log}')
sys.exit(result.returncode)
