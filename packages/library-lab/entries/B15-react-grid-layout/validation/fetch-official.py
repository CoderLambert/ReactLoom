from pathlib import Path
import json, datetime, hashlib, urllib.request
root = Path(__file__).resolve().parent.parent
(root / 'official').mkdir(exist_ok=True)
commit = '9b01a614bcdd13e7e921cf3f4b1c7e77942421c1'
evidence = {'repository': 'react-grid-layout/react-grid-layout', 'commit': commit, 'package': 'react-grid-layout', 'version': '2.3.0', 'requests': [], 'browserFromLabOrigin': 'NOT_RUN'}
def persist():
    (root / 'official/source-evidence.json').write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')
def get(url, body=True):
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'ReactLoom-LibraryLab-quality'}), timeout=30) as response:
        data = response.read() if body else None
        record = {'url': url, 'finalUrl': response.url, 'status': response.status, 'headers': dict(response.headers.items()), 'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat()}
        if data is not None: record.update(bytes=len(data), sha256=hashlib.sha256(data).hexdigest())
        else: record['body'] = 'NOT_READ: complete GET headers only'
        evidence['requests'].append(record)
        persist()
        return data
try:
    release = json.loads(get('https://registry.npmjs.org/react-grid-layout/2.3.0'))
    assert release['version'] == '2.3.0' and release['gitHead'] == commit
    evidence['npmRelease'] = {k: release[k] for k in ['name', 'version', 'gitHead', 'license', 'peerDependencies']}
    resize = json.loads(get('https://registry.npmjs.org/react-resizable/4.0.2'))
    assert resize['version'] == '4.0.2' and resize['license'] == 'MIT'
    evidence['resizableRelease'] = {k: resize[k] for k in ['name', 'version', 'gitHead', 'license', 'peerDependencies']}
    tag = json.loads(get('https://api.github.com/repos/react-grid-layout/react-grid-layout/git/ref/tags/2.3.0'))
    evidence['tag'] = '2.3.0'
    evidence['tagObject'] = tag['object']['sha']
    target = json.loads(get(tag['object']['url']))
    assert target['object']['sha'] == commit
    tree = json.loads(get('https://api.github.com/repos/react-grid-layout/react-grid-layout/git/trees/' + commit + '?recursive=1'))
    assert tree['truncated'] is False
    candidates = [item['path'] for item in tree['tree'] if item['type'] == 'blob' and 'readme' in Path(item['path']).name.lower()]
    assert candidates == ['README.md']
    evidence.update(readmeCandidates=candidates, treeTruncated=False, chosenReadme='README.md', language='en', selectionReason='Full pinned tree has only README.md; no official Chinese README. Preserve complete upstream original.')
    raw = 'https://raw.githubusercontent.com/react-grid-layout/react-grid-layout/' + commit + '/'
    readme = get(raw + 'README.md')
    (root / 'official/readme.md').write_bytes(readme)
    package = json.loads(get(raw + 'package.json'))
    assert package['version'] == '2.3.0'
    evidence['packageVersion'] = package['version']
    get('https://react-grid-layout.github.io/react-grid-layout/', body=False)
    evidence['framingEvaluation'] = {'status': 'unknown', 'reason': 'Actual GET headers retained; no actual Lab-origin browser confirmation. Re-evaluate policy headers when explicitly synchronizing.', 'browserFromLabOrigin': 'NOT_RUN'}
    evidence['syncedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    persist()
    print(json.dumps({k: v for k, v in evidence.items() if k != 'requests'}, ensure_ascii=False, indent=2))
    print('Actual requests:', len(evidence['requests']))
except Exception as error:
    evidence['error'] = repr(error)
    persist()
    raise
