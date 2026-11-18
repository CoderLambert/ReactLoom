"""Capture anonymous fixed-version official sources, only into this entry."""
import datetime
import hashlib
import json
from pathlib import Path
import urllib.request

ENTRY = Path(__file__).resolve().parents[1]
OFFICIAL = ENTRY / 'official'
OFFICIAL.mkdir(exist_ok=True)
COMMIT = '6739aca5f668a33a4fd1d2fd9f758dff95c57466'
NPM_HEAD = 'ecce1841c55e4a72dfe139a8992b56498660125e'
API = 'https://api.github.com/repos/emilkowalski/sonner'
RAW = 'https://raw.githubusercontent.com/emilkowalski/sonner'
requests = []


def get(url):
    started = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with urllib.request.urlopen(urllib.request.Request(url, headers={
        'User-Agent': 'ReactLoom-Library-Lab-source-audit',
    }), timeout=30) as response:
        data = response.read()
        requests.append({'url': url, 'finalUrl': response.url, 'status': response.status,
                         'checkedAt': started, 'headers': dict(response.headers),
                         'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
    return data


evidence = {'repository': 'emilkowalski/sonner', 'tag': 'v2.0.8',
            'commit': COMMIT, 'requests': requests}
try:
    registry = json.loads(get('https://registry.npmjs.org/sonner/2.0.8'))
    assert registry['version'] == '2.0.8' and registry['gitHead'] == NPM_HEAD
    evidence['registry'] = {key: registry[key] for key in ['name', 'version', 'gitHead']}
    tag = json.loads(get(API + '/git/ref/tags/v2.0.8'))
    assert tag['object']['sha'] == COMMIT and tag['object']['type'] == 'commit'
    package = json.loads(get(f'{RAW}/{COMMIT}/package.json'))
    assert package['version'] == '2.0.8'
    evidence['package'] = {key: package[key] for key in ['name', 'version', 'license', 'homepage', 'peerDependencies']}
    npm_package = json.loads(get(f'{RAW}/{NPM_HEAD}/package.json'))
    evidence['npmHeadManifestVersion'] = npm_package['version']
    tagged_state = get(f'{RAW}/{COMMIT}/src/state.ts')
    npm_state = get(f'{RAW}/{NPM_HEAD}/src/state.ts')
    assert tagged_state == npm_state
    evidence['sourceMatch'] = {'path': 'src/state.ts', 'equal': True,
                              'sha256': hashlib.sha256(tagged_state).hexdigest()}
    tree = json.loads(get(API + f'/git/trees/{COMMIT}?recursive=1'))
    assert tree['truncated'] is False
    evidence['treeTruncated'] = False
    evidence['readmeCandidates'] = [item['path'] for item in tree['tree'] if 'readme' in item['path'].lower()]
    data = get(f'{RAW}/{COMMIT}/README.md')
    assert hashlib.sha256(data).hexdigest() == '0809d104ce28f9c14b3b1e73257d93096f96134d2a5f2f225e5abf38b1aa4549'
    assert get(f'{RAW}/{NPM_HEAD}/README.md') == data
    (OFFICIAL / 'readme.md').write_bytes(data)
    evidence['readme'] = {'path': 'README.md', 'language': 'en', 'bytes': len(data),
                          'sha256': hashlib.sha256(data).hexdigest()}
    evidence['versionNote'] = 'npm2.0.8 gitHead的manifest仍为2.0.7；官方v2.0.8 tag的manifest为2.0.8。两commit的README和src/state.ts原文字节一致，展示原文固定匹配版本tag，不伪称两commit相同。'
    get(package['homepage'])
    headers = {key.lower(): value for key, value in requests[-1]['headers'].items()}
    evidence['homepage'] = {'requestIndex': len(requests) - 1, 'status': 'unknown',
                            'xFrameOptions': headers.get('x-frame-options'),
                            'contentSecurityPolicy': headers.get('content-security-policy'),
                            'reason': 'GET200；完整响应头未见X-Frame-Options/CSP，未从Lab origin实际确认iframe，保持unknown。'}
finally:
    evidence['syncedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    (OFFICIAL / 'source-evidence.json').write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')
print(f'B20 v2.0.8 fixed README {len(data)}B; {len(requests)} complete headers; npm gitHead difference preserved; homepage unknown')
