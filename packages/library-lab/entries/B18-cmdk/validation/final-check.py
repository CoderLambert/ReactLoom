"""Entry-only delivery checks; no browser or SDK execution."""
import hashlib
import json
from pathlib import Path
import re

entry = Path(__file__).resolve().parents[1]
metadata = json.loads((entry / 'library.json').read_text())
baseline = json.loads((entry / 'validation/baseline.json').read_text())
assert hashlib.sha256((entry / 'AGENTS.md').read_bytes()).hexdigest() == baseline['files']['AGENTS.md']
sources = set(path for demo in metadata['demos'] for path in demo['sourceFiles'])
assert len(sources) == 5
for source in sources:
    text = (entry / source).read_text()
    assert '@/' not in text and '.pnpm/' not in text
    assert max(map(len, text.splitlines())) < 180
readme = (entry / metadata['official']['readme']['snapshotPath']).read_bytes()
assert len(readme) == 14036
assert hashlib.sha256(readme).hexdigest() == metadata['official']['readme']['sha256']
for name in ['guide.md', 'agent.md', 'local-validation.md']:
    for target in re.findall(r'\[[^\]]*\]\(([^)]+)\)', (entry / name).read_text()):
        if target.startswith(('http:', 'https:', '#')):
            continue
        assert (entry / target.split('#', 1)[0]).is_file(), (name, target)
assert not list(entry.rglob('*.check.ts'))
assert not [file for file in entry.rglob('*') if file.suffix in {'.wasm', '.riv', '.tgz', '.zip'}]
proposal = (entry / 'validation/browser-proposal.txt').read_text()
assert len(re.findall(r'test\(\s*[\'"]@B18', proposal)) == 3
audit = json.loads((entry / 'validation/sdk-source-audit.json').read_text())
assert {item['package']['name']: item['package']['version'] for item in audit['records']} == {
    'cmdk': '1.1.1', '@radix-ui/react-dialog': '1.2.0', '@radix-ui/react-focus-scope': '1.2.0',
}
print('B18 local links, original AGENTS, 5 formatted portable sources, raw README, actual versions, 3 proposals and no temporary/binary copies PASS')
