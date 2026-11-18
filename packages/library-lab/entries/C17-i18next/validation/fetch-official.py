"""Anonymous fixed i18next source/header capture; failed acquisition preserves success."""
from pathlib import Path
import datetime
import hashlib
import json
import re
import tempfile
import urllib.parse
import urllib.request

ENTRY = Path(__file__).resolve().parents[1]
requests = []
attempted_url = None

def get(url, read_body=True):
    global attempted_url
    attempted_url = url
    checked = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'ReactLoom-Library-Lab-source-audit'}), timeout=30) as response:
        raw, redactions = [], []
        for key, value in response.headers.items():
            if key.lower() == 'set-cookie':
                cookie, separator, attributes = value.partition(';')
                name, _, secret = cookie.partition('=')
                value = name + '=<REDACTED_PUBLIC_COOKIE>' + (separator + attributes if separator else '')
                redactions.append({'header': key, 'valueSha256': hashlib.sha256(secret.encode()).hexdigest(), 'reason': 'Anonymous cookie not retained or reused; attributes preserved.'})
            raw.append([key, value])
        record = {'url': url, 'finalUrl': response.url, 'checkedAt': checked, 'status': response.status, 'headers': dict(raw), 'rawHeaders': raw, 'redactions': redactions, 'bodyStatus': 'NOT_READ', 'bytes': None, 'sha256': None}
        requests.append(record)
        data = response.read() if read_body else None
        if data is not None:
            record.update(bodyStatus='READ', bytes=len(data), sha256=hashlib.sha256(data).hexdigest())
        return data

def framing_policy(raw_headers):
    csps = [value for key, value in raw_headers if key.lower() == 'content-security-policy']
    xfos = [value for key, value in raw_headers if key.lower() == 'x-frame-options']
    ancestors = [match[1].strip() for value in csps if (match := re.search(r'(?:^|;)\s*frame-ancestors\s+([^;]+)', value))]
    # Current Lab origins are HTTP. HTTPS-only/app-scheme lists cannot authorize them.
    def excludes_current_http(value):
        tokens = value.split()
        return bool(tokens) and all(token in ["'self'", "'none'", 'https:', 'ionic:', 'capacitor:'] or token.startswith('https://') for token in tokens)
    blocked = any(excludes_current_http(value) for value in ancestors) or bool(not ancestors and any(value.upper() in ['DENY', 'SAMEORIGIN'] for value in xfos))
    return blocked, csps, xfos, ancestors

def capture():
    release = json.loads(get('https://registry.npmjs.org/i18next/26.4.3'))
    assert release['name'] == 'i18next' and release['version'] == '26.4.3'
    tag = json.loads(get('https://api.github.com/repos/i18next/i18next/git/ref/tags/v26.4.3'))['object']
    while tag['type'] == 'tag':
        tag = json.loads(get(tag['url']))['object']
    assert tag['type'] == 'commit'
    commit = release.get('gitHead') or tag['sha']
    assert commit == tag['sha'] and re.fullmatch('[0-9a-f]{40}', commit)
    tree = json.loads(get(f'https://api.github.com/repos/i18next/i18next/git/trees/{commit}?recursive=1'))
    assert tree['truncated'] is False
    candidates = [item['path'] for item in tree['tree'] if item['type'] == 'blob' and item['path'].split('/')[-1].lower().startswith('readme')]
    eligible = [path for path in candidates if '/' not in path or path.startswith('docs/')]
    chinese = [path for path in eligible if re.search(r'zh[-_]cn|zh[-_]hans|中文', path, re.I)]
    path = sorted(chinese, key=lambda value: (value.count('/'), value))[0] if chinese else 'README.md'
    assert path in candidates
    base = f'https://raw.githubusercontent.com/i18next/i18next/{commit}/'
    manifest = json.loads(get(base + 'package.json'))
    assert manifest['name'] == 'i18next' and isinstance(manifest['version'], str)
    original = get(base + urllib.parse.quote(path, safe='/'))
    assert original and not original.lstrip().startswith(b'<!DOCTYPE')
    homepage = manifest['homepage']
    get(homepage, read_body=False)
    home = requests[-1]
    blocked, csps, xfos, ancestors = framing_policy(home['rawHeaders'])
    evidence = {'repository': 'i18next/i18next', 'version': '26.4.3', 'tag': 'v26.4.3', 'tagCommit': tag['sha'], 'commit': commit, 'release': {key: release.get(key) for key in ['name', 'version', 'gitHead', 'license', 'repository', 'homepage']}, 'manifest': {key: manifest.get(key) for key in ['name', 'version', 'license', 'homepage']}, 'versionBasis': {'installedVersion': '26.4.3', 'sourceManifestVersion': manifest['version'], 'reason': 'Official tag and registry gitHead bind this fixed source; source manifest declaration is retained truthfully.'}, 'treeTruncated': False, 'readmeCandidates': candidates, 'eligibleReadmeCandidates': eligible, 'chineseReadmeCandidates': chinese, 'readme': {'path': path, 'snapshotPath': 'official/readme.md', 'language': 'zh-CN' if chinese else 'en', 'bytes': len(original), 'sha256': hashlib.sha256(original).hexdigest()}, 'homepage': {'url': homepage, 'status': 'blocked' if blocked else 'unknown', 'checkedAt': home['checkedAt'], 'enforcedCSP': csps, 'xFrameOptions': xfos, 'frameAncestors': ancestors, 'browserFromLabOrigin': 'NOT_RUN', 'targetLabOrigins': ['http://127.0.0.1:4319', 'http://localhost:4319'], 'reason': 'Captured enforced final response policy excludes the current HTTP Lab origins; an HTTPS deployment requires its own check.' if blocked else 'Actual complete response headers alone do not establish usable Lab-origin iframe content.'}, 'requests': requests, 'syncedAt': datetime.datetime.now(datetime.timezone.utc).isoformat()}
    serialized = json.dumps(evidence, ensure_ascii=False, indent=2) + '\n'
    official = ENTRY / 'official'
    official.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='.source-capture-', dir=official) as directory:
        staging = Path(directory)
        (staging / 'readme.md').write_bytes(original)
        (staging / 'source-evidence.json').write_text(serialized)
        (staging / 'readme.md').replace(official / 'readme.md')
        (staging / 'source-evidence.json').replace(official / 'source-evidence.json')
    print(json.dumps({key: evidence[key] for key in ['commit', 'versionBasis', 'readme', 'homepage']}, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    try:
        capture()
    except Exception as error:
        (ENTRY / 'validation/source-evidence.failed.json').write_text(json.dumps({'failure': {'url': attempted_url, 'type': type(error).__name__, 'message': str(error)}, 'requests': requests}, ensure_ascii=False, indent=2) + '\n')
        raise
