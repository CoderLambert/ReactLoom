"""Read-only checks of this entry's delivery, not an SDK/browser test."""
import hashlib
import json
from pathlib import Path
import re

entry = Path(__file__).resolve().parents[1]
metadata = json.loads((entry / 'library.json').read_text())
baseline = json.loads((entry / 'validation/baseline.json').read_text())
assert hashlib.sha256((entry / 'AGENTS.md').read_bytes()).hexdigest() == baseline['files']['AGENTS.md']
sources = set(path for demo in metadata['demos'] for path in demo['sourceFiles'])
assert len(sources) == 4
for path in sources:
    content = (entry / path).read_text()
    assert '@/' not in content and '.pnpm/' not in content
    assert max(map(len, content.splitlines())) < 180
snapshot = (entry / metadata['official']['readme']['snapshotPath']).read_bytes()
assert hashlib.sha256(snapshot).hexdigest() == metadata['official']['readme']['sha256']
for name in ['guide.md', 'agent.md', 'local-validation.md']:
    for target in re.findall(r'\[[^\]]*\]\(([^)]+)\)', (entry / name).read_text()):
        if target.startswith(('https:', 'http:', '#')):
            continue
        assert (entry / target.split('#', 1)[0]).is_file(), (name, target)
assert not list(entry.rglob('*.check.ts'))
assert not [path for path in entry.rglob('*') if path.suffix in {'.riv', '.wasm', '.tgz', '.zip'}]
assert (entry / 'validation/browser-proposal.txt').read_text().count("test('@B10") == 3
print('B10 local links, original AGENTS, 4 portable sources/format, README bytes, 3 browser proposals and no temporary/binary copies PASS')
