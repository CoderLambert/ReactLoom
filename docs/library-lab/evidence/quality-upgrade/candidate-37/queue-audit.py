from collections import Counter
from pathlib import Path
import json

base = Path('openspec/roadmaps/upgrade-library-quality')
queue = json.loads((base / 'queue.json').read_text())
entries = list(Path('packages/library-lab/entries').glob('*/library.json'))
canonical = {json.loads(path.read_text())['entryId']: str(path.parent) for path in entries}
items = queue['items']
ids = {item['entryId'] for item in items}
assert len(items) == len(ids) == 116
assert len(canonical) == len(entries) == 119
assert canonical.keys() - ids == {'C20', 'D15', 'F18'}
for item in items:
    entry_id = item['entryId']
    assert canonical[entry_id] == item['path'], entry_id
    assert (base / item['result']).is_file(), entry_id
    assert item['owner'] is None, entry_id
    entry = Path(item['path'])
    if item['status'] == 'content_done':
        assert (entry / 'agent.md').is_file(), entry_id
        assert (entry / 'guide.md').is_file(), entry_id
    verification = json.loads((entry / 'verification.json').read_text())
    assert not any(verification[k]['status'] == 'PASS' for k in ('sdk', 'build', 'browser')), entry_id
counts = Counter(item['status'] for item in items)
assert counts == {'content_done': 115, 'blocked': 1}, counts
assert [item['entryId'] for item in items if item['status'] == 'blocked'] == ['E19']
assert not Path('packages/library-lab/public/ffmpeg-core').exists()
print(json.dumps({'entries': len(entries), 'queue': counts, 'references': sorted(canonical.keys() - ids), 'blocker': 'E19 resource prerequisite', 'owners': 0, 'missingResults': 0, 'formalPassReceipts': 0}, ensure_ascii=False))
