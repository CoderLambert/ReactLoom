"""Anonymous pinned upstream evidence; never replace successful snapshots on a failed fetch."""
from pathlib import Path
import datetime
import hashlib
import json
import re
import tempfile
import urllib.request

ENTRY = Path(__file__).resolve().parents[1]
requests = []
attempt_url = None
def get(url, read_body=True):
    global attempt_url
    attempt_url = url
    started = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'ReactLoom-Library-Lab-source-audit'}), timeout=30) as response:
        body = response.read() if read_body else None
        raw_headers = []
        redactions = []
        for key, value in response.headers.items():
            if key.lower() == 'set-cookie':
                cookie, separator, attributes = value.partition(';')
                name, _, secret = cookie.partition('=')
                value = name + '=<REDACTED_PUBLIC_SESSION_COOKIE>' + (separator + attributes if separator else '')
                redactions.append({'header': key, 'valueSha256': hashlib.sha256(secret.encode()).hexdigest(), 'reason': 'Anonymous response cookie value not retained or reused; header attributes preserved.'})
            raw_headers.append([key, value])
        item = {'url': url, 'finalUrl': response.url, 'status': response.status, 'checkedAt': started, 'headers': dict(raw_headers), 'rawHeaders': raw_headers, 'bodyStatus': 'READ' if read_body else 'NOT_READ'}
        if body is not None:
            item.update({'bytes': len(body), 'sha256': hashlib.sha256(body).hexdigest()})
        if redactions:
            item['redactions'] = redactions
        requests.append(item)
        return body

def capture():
    release = json.loads(get('https://registry.npmjs.org/@fullcalendar%2Freact/7.1.3'))
    polyfill = json.loads(get('https://registry.npmjs.org/temporal-polyfill/1.0.4'))
    assert release['version'] == '7.1.3' and polyfill['version'] == '1.0.4'
    commit = release.get('gitHead')
    tag_object = None
    if not commit:
        obj = json.loads(get('https://api.github.com/repos/fullcalendar/fullcalendar/git/ref/tags/v7.1.3'))['object']
        if obj['type'] == 'tag':
            tag_object = obj['sha']
            obj = json.loads(get('https://api.github.com/repos/fullcalendar/fullcalendar/git/tags/' + obj['sha']))['object']
        assert obj['type'] == 'commit'
        commit = obj['sha']
    assert re.fullmatch('[0-9a-f]{40}', commit)
    tree = json.loads(get(f'https://api.github.com/repos/fullcalendar/fullcalendar/git/trees/{commit}?recursive=1'))
    assert tree['truncated'] is False
    candidates = [item['path'] for item in tree['tree'] if item['path'].split('/')[-1].lower().startswith('readme')]
    eligible = [path for path in candidates if path.startswith('packages/react/README')]
    chinese = [path for path in eligible if 'zh' in path.lower() or '中文' in path]
    path = chinese[0] if chinese else 'packages/react/README.md'
    assert path in candidates
    base = f'https://raw.githubusercontent.com/fullcalendar/fullcalendar/{commit}/'
    manifest = json.loads(get(base + 'packages/react/package.json'))
    assert manifest['name'] == '@fullcalendar/react' and manifest['version'] == '7.1.3'
    readme = get(base + path)
    assert readme and not readme.lstrip().startswith(b'<!DOCTYPE')
    get('https://fullcalendar.io/', read_body=False)
    homepage = requests[-1]
    headers = {key.lower(): value for key, value in homepage['headers'].items()}
    xfo = headers.get('x-frame-options', '')
    csp = headers.get('content-security-policy', '')
    ancestors = re.search(r"(?:^|;)\s*frame-ancestors\s+([^;]+)", csp)
    blocked = bool(ancestors and ancestors[1].strip() in ["'self'", "'none'"]) or bool(not ancestors and xfo.upper() in ['DENY', 'SAMEORIGIN'])
    evidence = {'repository': 'fullcalendar/fullcalendar', 'version': '7.1.3', 'tag': 'v7.1.3', 'tagObject': tag_object, 'commit': commit, 'release': {key: release.get(key) for key in ['name','version','gitHead','license','repository','peerDependencies']}, 'polyfill': {key: polyfill.get(key) for key in ['name','version','gitHead','license','repository']}, 'manifest': {key: manifest.get(key) for key in ['name','version','license','repository','peerDependencies']}, 'treeTruncated': False, 'readmeCandidates': candidates, 'packageReadmeCandidates': eligible, 'readme': {'path': path,'language':'zh-CN' if chinese else 'en','bytes':len(readme),'sha256':hashlib.sha256(readme).hexdigest()}, 'requests': requests, 'homepage': {'url':homepage['url'],'status':'blocked' if blocked else 'unknown','reason':'Actual enforced complete response headers restrict cross-origin framing.' if blocked else 'Actual GET headers retained; real Lab-origin browser NOT_RUN.','checkedAt':homepage['checkedAt'],'browserFromLabOrigin':'NOT_RUN'}, 'syncedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()}
    official = ENTRY / 'official'
    official.mkdir(exist_ok=True)
    # Acquire and serialize everything before staging either successful artifact.
    serialized = json.dumps(evidence,ensure_ascii=False,indent=2)+'\n'
    with tempfile.TemporaryDirectory(prefix='.source-capture-', dir=official) as staging:
        staged = Path(staging)
        (staged/'readme.md').write_bytes(readme)
        (staged/'source-evidence.json').write_text(serialized)
        (staged/'readme.md').replace(official/'readme.md')
        (staged/'source-evidence.json').replace(official/'source-evidence.json')
    print(json.dumps({'commit':commit,'readme':evidence['readme'],'homepage':evidence['homepage'],'requests':len(requests)},ensure_ascii=False,indent=2))

if __name__ == '__main__':
    try:
        capture()
    except Exception as error:
        (ENTRY / 'validation/source-fetch-failure.json').write_text(json.dumps({'failure': {'type': type(error).__name__, 'message': str(error), 'url': attempt_url}, 'requests': requests}, ensure_ascii=False, indent=2) + '\n')
        raise
