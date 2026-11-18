"""Read-only source/document delivery checks, not SDK/HTTP/browser execution."""
from pathlib import Path
import ast
import hashlib
import json
import re

ENTRY = Path(__file__).resolve().parents[1]
ROOT = ENTRY.parents[3]
candidate = json.loads((ROOT / 'docs/library-lab/evidence/quality-upgrade/candidate-18/inputs.json').read_text())
metadata = json.loads((ENTRY / 'library.json').read_text())
sources = metadata['demos'][0]['sourceFiles']
assert len(sources) == 7
for source in sources:
    path = ENTRY / source
    assert hashlib.sha256(path.read_bytes()).hexdigest() == candidate['files'][str(path.relative_to(ROOT))]
for name in ['guide.md', 'agent.md', 'local-validation.md']:
    for link in re.findall(r'\]\(([^)]+)\)', (ENTRY / name).read_text()):
        if '://' not in link and not link.startswith('#'):
            assert (ENTRY / link.split('#')[0]).exists(), (name, link)
for script in (ENTRY / 'validation').glob('*.py'):
    ast.parse(script.read_text())
assert not list((ENTRY / 'validation').glob('.proposal-types-*'))
assert not list(ENTRY.rglob('*.check.ts'))
assert not list(ENTRY.rglob('*.zip'))
assert not list(ENTRY.rglob('*.webm'))
assert len(re.findall(r"test\(\s*['\"]@C15", (ENTRY / 'validation/browser-proposal.txt').read_text())) == 3
assert all(value['status'] == 'NOT_RUN' for value in json.loads((ENTRY / 'verification.json').read_text()).values())
print('7 production files byte-identical to candidate18; 3 complete typed UI proposals; document links/Python syntax valid; temporary proposals removed; no binary artifacts; formal three statuses NOT_RUN. No SDK/HTTP/browser rerun.')
