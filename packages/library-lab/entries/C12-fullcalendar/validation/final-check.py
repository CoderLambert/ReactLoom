"""Read-only delivery/binding checks; no SDK or external HTTP execution."""
from pathlib import Path
import ast
import hashlib
import json
import re

ENTRY = Path(__file__).resolve().parents[1]
ROOT = ENTRY.parents[3]
metadata = json.loads((ENTRY / 'library.json').read_text())
sources = sorted(set(path for demo in metadata['demos'] for path in demo['sourceFiles']))
assert len(sources) == 6
candidate = json.loads((ROOT / 'docs/library-lab/evidence/quality-upgrade/candidate-17/inputs.json').read_text())
for source in sources:
    path = ENTRY / source
    assert hashlib.sha256(path.read_bytes()).hexdigest() == candidate['files'][str(path.relative_to(ROOT))]
for name in ['guide.md', 'agent.md', 'local-validation.md']:
    for link in re.findall(r'\]\(([^)]+)\)', (ENTRY / name).read_text()):
        if '://' not in link and not link.startswith('#'):
            assert (ENTRY / link.split('#')[0]).exists(), (name, link)
for path in (ENTRY / 'validation').glob('*.py'):
    ast.parse(path.read_text())
assert not list((ENTRY / 'validation').glob('.proposal-types-*'))
assert not list(ENTRY.rglob('*.check.ts'))
assert not list(ENTRY.rglob('*.webm'))
assert not list(ENTRY.rglob('*.zip'))
assert len(re.findall(r"test\('@C12", (ENTRY / 'validation/browser-proposal.txt').read_text())) == 3
assert all(item['status'] == 'NOT_RUN' for item in json.loads((ENTRY / 'verification.json').read_text()).values())
print('6 production files byte-identical to candidate17; 3 complete typed proposals; local links and Python syntax valid; no temporary proposal/binary artifacts; formal NOT_RUN. No SDK/HTTP/browser run.')
