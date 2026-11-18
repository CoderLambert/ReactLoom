"""Read-only checks of this migration entry; no legacy SDK or browser execution."""
import hashlib
import json
from pathlib import Path
import re

entry = Path(__file__).resolve().parents[1]
metadata = json.loads((entry / 'library.json').read_text())
baseline = json.loads((entry / 'validation/baseline.json').read_text())
assert hashlib.sha256((entry / 'AGENTS.md').read_bytes()).hexdigest() == baseline['files']['AGENTS.md']
sources = set(name for demo in metadata['demos'] for name in demo['sourceFiles'])
assert len(sources) == 4
for name in sources:
    text = (entry / name).read_text()
    assert '@/' not in text and '.pnpm/' not in text
    assert not re.search(r"from ['\"]react-beautiful-dnd['\"]", text)
    assert max(map(len, text.splitlines())) < 190
for name in ['guide.md', 'agent.md', 'local-validation.md']:
    for target in re.findall(r'\[[^\]]*\]\(([^)]+)\)', (entry / name).read_text()):
        if target.startswith(('https:', 'http:', '#')):
            continue
        assert (entry / target.split('#', 1)[0]).is_file(), (name, target)
assert not list(entry.rglob('*.check.ts'))
assert not [file for file in entry.rglob('*') if file.suffix in {'.riv', '.wasm', '.zip', '.tgz'}]
assert len(re.findall(r'test\(\s*[\'"]@B22', (entry / 'validation/browser-proposal.txt').read_text())) == 3
evidence = json.loads((entry / 'official/source-evidence.json').read_text())
for path, expected in [('official/readme.md', evidence['readme']['sha256']), ('official/legacy-readme.md', evidence['legacy']['sha256'])]:
    assert hashlib.sha256((entry / path).read_bytes()).hexdigest() == expected
for request in evidence['requests']:
    for key, value in request.get('headers', {}).items():
        if key.lower() == 'set-cookie':
            assert '<REDACTED_PUBLIC_SESSION_COOKIE>' in value
print('B22 4 portable sources/no legacy import, original AGENTS, links, 3 proposals, separate original README hashes, redacted session cookies and no temporary/binary copies PASS')
