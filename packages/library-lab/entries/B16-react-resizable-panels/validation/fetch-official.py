"""Anonymous, fixed-version official source capture; writes only this entry."""
import datetime
import hashlib
import json
from pathlib import Path
import urllib.request

ENTRY = Path(__file__).resolve().parents[1]
OFFICIAL = ENTRY / 'official'
OFFICIAL.mkdir(exist_ok=True)
COMMIT = '0cd376c57a19900d22f33aa8eb46f417a7437c12'
API = 'https://api.github.com/repos/bvaughn/react-resizable-panels'
RAW = f'https://raw.githubusercontent.com/bvaughn/react-resizable-panels/{COMMIT}'
requests = []


def get(url):
    started = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with urllib.request.urlopen(urllib.request.Request(url, headers={
        'User-Agent': 'ReactLoom-Library-Lab-source-audit',
    }), timeout=30) as response:
        data = response.read()
        requests.append({
            'url': url, 'finalUrl': response.url, 'status': response.status,
            'checkedAt': started, 'headers': dict(response.headers),
            'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(),
        })
    return data


evidence = {'repository': 'bvaughn/react-resizable-panels', 'tag': '4.14.1',
            'commit': COMMIT, 'requests': requests}
try:
    registry = json.loads(get('https://registry.npmjs.org/react-resizable-panels/4.14.1'))
    assert registry['gitHead'] == COMMIT
    evidence['registry'] = {key: registry[key] for key in ['name', 'version', 'gitHead']}
    ref = json.loads(get(API + '/git/ref/tags/4.14.1'))
    tag = json.loads(get(ref['object']['url']))
    assert tag['object']['sha'] == COMMIT and tag['object']['type'] == 'commit'
    evidence['tagObject'] = {'sha': ref['object']['sha'], 'commit': COMMIT,
                             'signatureStatus': tag['verification']['reason']}
    tree = json.loads(get(API + f'/git/trees/{COMMIT}?recursive=1'))
    assert tree['truncated'] is False
    evidence['readmeCandidates'] = [item['path'] for item in tree['tree']
                                    if 'readme' in item['path'].lower()]
    evidence['treeTruncated'] = False
    package = json.loads(get(RAW + '/package.json'))
    assert package['name'] == 'react-resizable-panels' and package['version'] == '4.14.1'
    evidence['package'] = {key: package[key] for key in [
        'name', 'version', 'license', 'homepage', 'peerDependencies']}
    data = get(RAW + '/README.md')
    assert hashlib.sha256(data).hexdigest() == 'd27812bc8cf8a5e07f0a58bcf68a8f48cc3cac4d22f917777e62662ab61c231c'
    (OFFICIAL / 'readme.md').write_bytes(data)
    evidence['readme'] = {'path': 'README.md', 'language': 'en', 'bytes': len(data),
                          'sha256': hashlib.sha256(data).hexdigest()}
    get(package['homepage'])
    headers = {key.lower(): value for key, value in requests[-1]['headers'].items()}
    evidence['homepage'] = {
        'requestIndex': len(requests) - 1,
        'status': 'unknown',
        'xFrameOptions': headers.get('x-frame-options'),
        'contentSecurityPolicy': headers.get('content-security-policy'),
        'reason': 'GET200；完整响应头未见X-Frame-Options或Content-Security-Policy，未从Lab origin实际验证iframe，保持unknown。',
    }
finally:
    evidence['syncedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    (OFFICIAL / 'source-evidence.json').write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')
print(f'B16 fixed 4.14.1 {COMMIT}: original README {len(data)}B; {len(requests)} complete response headers; homepage unknown')
