"""Acquire immutable package README bytes and complete anonymous response evidence."""
import datetime
import hashlib
import json
import re
import tempfile
from pathlib import Path
import urllib.request

ENTRY = Path(__file__).resolve().parents[1]
OFFICIAL = ENTRY / 'official'
OFFICIAL.mkdir(exist_ok=True)
attempted_url = None
requests = []
evidence = {'requests': requests}
def get(url):
    global attempted_url
    attempted_url = url
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'ReactLoom-Library-Lab'}), timeout=30) as response:
        data = response.read()
        requests.append({'url': url, 'finalUrl': response.url, 'status': response.status, 'checkedAt': now, 'headers': dict(response.headers), 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
    return data
try:
    react = json.loads(get('https://registry.npmjs.org/ag-grid-react/36.2.0'))
    community = json.loads(get('https://registry.npmjs.org/ag-grid-community/36.2.0'))
    commit = react['gitHead']
    assert commit == '0fee5b7b1e839ae23fe860e404042448f3c1375d'
    assert react['version'] == community['version'] == '36.2.0'
    raw = f'https://raw.githubusercontent.com/ag-grid/ag-grid/{commit}'
    tree = json.loads(get(f'https://api.github.com/repos/ag-grid/ag-grid/git/trees/{commit}?recursive=1'))
    assert tree['truncated'] is False
    candidates = [x['path'] for x in tree['tree'] if x['path'].split('/')[-1].lower().startswith('readme')]
    target = 'packages/ag-grid-react/README.md'
    assert target in candidates
    package_candidates = [x for x in candidates if x.startswith('packages/ag-grid-react/')]
    assert not any('zh' in x.lower() or '中文' in x for x in package_candidates)
    react_manifest = json.loads(get(f'{raw}/packages/ag-grid-react/package.json'))
    community_manifest = json.loads(get(f'{raw}/packages/ag-grid-community/package.json'))
    assert react_manifest['version'] == community_manifest['version'] == '36.2.0'
    data = get(f'{raw}/{target}')
    get('https://www.ag-grid.com/react-data-grid/')
    headers = {k.lower():v for k,v in requests[-1]['headers'].items()}
    ancestors = re.search(r"(?:^|;)\s*frame-ancestors\s+([^;]+)", headers.get('content-security-policy', ''))
    frame_ancestors = ancestors.group(1).strip() if ancestors else None
    restricted = frame_ancestors == "'self' https://*.ag-grid.com"
    evidence.update(repository='ag-grid/ag-grid',commit=commit,path=target,version='36.2.0',language='en',readmeCandidates=candidates,packageReadmeCandidates=package_candidates,treeTruncated=False,registry={n:{k:m.get(k) for k in ['name','version','gitHead','license','peerDependencies']} for n,m in [('react',react),('community',community)]},manifests={'react':react_manifest,'community':community_manifest},snapshot={'path':'official/readme.md','bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()},homepage={'requestIndex':len(requests)-1,'xFrameOptions':headers.get('x-frame-options'),'contentSecurityPolicy':headers.get('content-security-policy'),'frameAncestors':frame_ancestors,'status':'blocked' if restricted else 'unknown','reason':'CSP frame-ancestors only permits AG Grid origins; loopback Lab is excluded.' if restricted else 'No confirmed Lab-origin embedding result.','browserFromLabOrigin':'NOT_RUN'})
except Exception as error:
    evidence['syncedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    evidence['failure'] = {'url': attempted_url, 'type': type(error).__name__, 'message': str(error)}
    # A failed refresh records its own attempt, never replaces the last success pair.
    (OFFICIAL / 'source-evidence.failed.json').write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')
    raise
else:
    evidence['syncedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    # Stage both complete artifacts before replacing either successful artifact.
    with tempfile.TemporaryDirectory(prefix='.source-capture-', dir=OFFICIAL) as staging:
        staged_readme = Path(staging) / 'readme.md'
        staged_evidence = Path(staging) / 'source-evidence.json'
        staged_readme.write_bytes(data)
        staged_evidence.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')
        staged_readme.replace(OFFICIAL / 'readme.md')
        staged_evidence.replace(OFFICIAL / 'source-evidence.json')
print('C08 official package README',evidence['snapshot'],'requests',len(requests))
