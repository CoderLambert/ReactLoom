"""Read-only scoped content inspection; not an SDK/browser test."""
from pathlib import Path
import hashlib
import json
import re
entry=Path(__file__).resolve().parents[1]
metadata=json.loads((entry/'library.json').read_text())
source=json.loads((entry/'official/source-evidence.json').read_text())
assert len(metadata['demos'])==3
files=set(path for demo in metadata['demos'] for path in demo['sourceFiles'])
assert len(files)==5
for path in files:
    data=(entry/path).read_text()
    assert '@/' not in data and '.pnpm/' not in data
    assert max(map(len,data.splitlines()))<190
for path in ['guide.md','agent.md','local-validation.md']:
    for target in re.findall(r'\[[^\]]*\]\(([^)]+)\)',(entry/path).read_text()):
        if not target.startswith(('http:','https:','#')):
            assert (entry/target.split('#',1)[0]).is_file(),(path,target)
assert not list(entry.rglob('*.check.ts'))
assert not [p for p in entry.rglob('*') if p.suffix in {'.riv','.wasm','.zip','.tgz'}]
assert all(release['gitHead']==source['commit'] for release in source['releases'].values())
assert len(source['readmeCandidates'])==8
assert not [path for path in source['readmeCandidates'] if 'zh' in path.lower() or '中文' in path]
for readme in source['readmes'].values():
    assert hashlib.sha256((entry/readme['snapshotPath']).read_bytes()).hexdigest()==readme['sha256']
assert len(re.findall(r'test\(\s*[\'\"]@C06',(entry/'validation/browser-proposal.txt').read_text()))==3
for request in source['requests']:
    for key,value in request['headers'].items():
        if key.lower()=='set-cookie':assert '<REDACTED_PUBLIC_SESSION_COOKIE>' in value
print('C06 5 portable sources/3 real proposals/links/2 original README hashes/exact release gitHeads/no Chinese candidate/no temporary or binary copies PASS; no SDK/browser executed')
