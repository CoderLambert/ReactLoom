"""Anonymous official-source sync, scoped to this entry; no install or credentials."""
import datetime
import hashlib
import json
from pathlib import Path
import urllib.request

ENTRY = Path(__file__).resolve().parents[1]
OFFICIAL = ENTRY / 'official'
OFFICIAL.mkdir(exist_ok=True)
COMMIT = 'ad7ecda5296b0295b41a51ecb01fce6204acd099'
requests = []


def get(url):
    started = datetime.datetime.now(datetime.timezone.utc).isoformat()
    request = urllib.request.Request(url, headers={'User-Agent': 'ReactLoom-Library-Lab-source-audit'})
    with urllib.request.urlopen(request, timeout=30) as response:
        data = response.read()
        requests.append({
            'url': url, 'finalUrl': response.url, 'status': response.status,
            'checkedAt': started, 'headers': dict(response.headers),
            'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(),
        })
    return data


evidence = {'repository': 'mui/base-ui', 'tag': 'v1.9.0', 'commit': COMMIT, 'requests': requests}
try:
    ref = json.loads(get('https://api.github.com/repos/mui/base-ui/git/ref/tags/v1.9.0'))
    tag = json.loads(get(ref['object']['url']))
    assert tag['object'] == {'sha': COMMIT, 'type': 'commit', 'url': f'https://api.github.com/repos/mui/base-ui/git/commits/{COMMIT}'}
    evidence['tagObject'] = {'sha': ref['object']['sha'], 'commit': tag['object']['sha']}
    candidates = {}
    for path in ['', 'packages/react']:
        files = json.loads(get(f'https://api.github.com/repos/mui/base-ui/contents/{path}?ref={COMMIT}'))
        candidates[path or 'root'] = [item['name'] for item in files if item['name'].lower().startswith('readme')]
    evidence['readmeCandidates'] = candidates
    package = json.loads(get(f'https://raw.githubusercontent.com/mui/base-ui/{COMMIT}/packages/react/package.json'))
    evidence['package'] = {key: package[key] for key in ['name', 'version', 'license', 'homepage', 'peerDependencies']}
    assert package['name'] == '@base-ui/react' and package['version'] == '1.9.0'
    data = get(f'https://raw.githubusercontent.com/mui/base-ui/{COMMIT}/packages/react/README.md')
    assert len(data) == 1856 and hashlib.sha256(data).hexdigest() == 'b5444513c6b8cd0d19777a7c7f0031c8f7d287e5ce04093b5ca68e50cab791c6'
    (OFFICIAL / 'readme.md').write_bytes(data)
    evidence['readme'] = {'path': 'packages/react/README.md', 'language': 'en', 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
    get(package['homepage'])
    evidence['homepage'] = {
        'requestIndex': len(requests) - 1,
        'status': 'unknown',
        'reason': 'GET200；实际响应含CSP frame-ancestors *和XFO SAMEORIGIN，现代浏览器以CSP为准；未从Lab origin实际确认iframe内容，不能据头部记allowed。',
    }
finally:
    evidence['syncedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    (OFFICIAL / 'source-evidence.json').write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')
print(f'B10 official {COMMIT} README1856B saved; {len(requests)} anonymous requests with complete headers')
