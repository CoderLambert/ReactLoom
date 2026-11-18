"""Anonymous JSON Forms3.8.0 source capture, scoped to this entry."""
import datetime
import hashlib
import json
from pathlib import Path
import urllib.request

ENTRY = Path(__file__).resolve().parents[1]
OFFICIAL = ENTRY / 'official'
OFFICIAL.mkdir(exist_ok=True)
requests = []


def get(url, read_body=True):
    started = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with urllib.request.urlopen(urllib.request.Request(url, headers={
        'User-Agent': 'ReactLoom-Library-Lab-source-audit',
    }), timeout=30) as response:
        data = response.read() if read_body else None
        requests.append({'url': url, 'finalUrl': response.url, 'status': response.status,
                         'checkedAt': started, 'headers': dict(response.headers),
                         'bytes': len(data) if data is not None else None, 'sha256': hashlib.sha256(data).hexdigest() if data is not None else None, 'bodyStatus': 'READ' if read_body else 'NOT_READ'})
    return data


evidence = {'repository': 'eclipsesource/jsonforms', 'version': '3.8.0', 'requests': requests}
try:
    packages = {}
    for name in ['core', 'react', 'vanilla-renderers']:
        registry = json.loads(get(f'https://registry.npmjs.org/@jsonforms%2F{name}/3.8.0'))
        assert registry['version'] == '3.8.0'
        packages[name] = {key: registry.get(key) for key in ['name', 'version', 'gitHead', 'license', 'peerDependencies']}
    # These npm manifests omit gitHead; anchor to the real official version tag.
    assert all(package['gitHead'] is None for package in packages.values())
    tag = json.loads(get('https://api.github.com/repos/eclipsesource/jsonforms/git/ref/tags/v3.8.0'))
    commit = tag['object']['sha']
    assert tag['object']['type'] == 'commit' and commit == '6075bcee93205c8fbe1f88eec19ed9058ad0f965'
    evidence.update({'commit': commit, 'tag': 'v3.8.0', 'packages': packages, 'versionBasis': '三个npm3.8.0均省略gitHead；固定官方v3.8.0 tag并核同commit manifest，不伪造npm gitHead。'})
    raw = f'https://raw.githubusercontent.com/eclipsesource/jsonforms/{commit}'
    manifest = json.loads(get(raw + '/packages/react/package.json'))
    assert manifest['name'] == '@jsonforms/react' and manifest['version'] == '3.8.0'
    evidence['manifest'] = {key: manifest.get(key) for key in ['name', 'version', 'license', 'peerDependencies']}
    tree = json.loads(get(f'https://api.github.com/repos/eclipsesource/jsonforms/git/trees/{commit}?recursive=1'))
    assert tree['truncated'] is False
    candidates = [item['path'] for item in tree['tree'] if 'readme' in item['path'].lower()]
    evidence['treeTruncated'] = False
    evidence['readmeCandidates'] = candidates
    preferred = [path for path in candidates if path.startswith('packages/react/README') or '/' not in path]
    chinese = [path for path in preferred if 'zh' in path.lower() or '中文' in path]
    path = chinese[0] if chinese else ('packages/react/README.md' if 'packages/react/README.md' in candidates else 'README.md')
    data = get(raw + '/' + path)
    evidence['readme'] = {'path': path, 'language': 'zh-CN' if chinese else 'en',
                          'bytes': len(data) if data is not None else None, 'sha256': hashlib.sha256(data).hexdigest() if data is not None else None, 'bodyStatus': 'READ'}
    get('https://jsonforms.io/', read_body=False)
    headers = {key.lower(): value for key, value in requests[-1]['headers'].items()}
    evidence['homepage'] = {'requestIndex': len(requests) - 1,
                            'xFrameOptions': headers.get('x-frame-options'),
                            'contentSecurityPolicy': headers.get('content-security-policy'), 'status': 'blocked' if "frame-ancestors 'self'" in headers.get('content-security-policy', '') else 'unknown', 'reason': '仅按实际最终完整响应头判断；frame-ancestors self限制跨源Lab，正文NOT_READ；没有实际iframe允许证明。'}
except Exception:
    evidence['syncedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    # A failed refresh must not overwrite the last successful snapshot/evidence pair.
    (OFFICIAL / 'source-evidence.failed.json').write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')
    raise
else:
    evidence['syncedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    temporary_readme = OFFICIAL / 'readme.md.tmp'
    temporary_evidence = OFFICIAL / 'source-evidence.json.tmp'
    temporary_readme.write_bytes(data)
    temporary_evidence.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')
    temporary_readme.replace(OFFICIAL / 'readme.md')
    temporary_evidence.replace(OFFICIAL / 'source-evidence.json')
print(f'C04 fixed {commit}, original {path} {len(data)}B; {len(requests)} complete headers; homepage:', evidence['homepage'])
