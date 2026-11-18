"""Anonymous immutable Day.js sources; failed attempts preserve the successful pair."""
from pathlib import Path
import datetime
import hashlib
import json
import re
import tempfile
import urllib.parse
import urllib.request

ENTRY = Path(__file__).resolve().parents[1]
OFFICIAL = ENTRY / 'official'
requests = []
attempted_url = None

def get(url, read_body=True):
    global attempted_url
    attempted_url = url
    checked = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'ReactLoom-Library-Lab-source-audit'}), timeout=30) as response:
        headers, redactions = [], []
        for key, value in response.headers.items():
            if key.lower() == 'set-cookie':
                cookie, separator, attributes = value.partition(';')
                name, _, secret = cookie.partition('=')
                value = name + '=<REDACTED_PUBLIC_COOKIE>' + (separator + attributes if separator else '')
                redactions.append({'header': key, 'valueSha256': hashlib.sha256(secret.encode()).hexdigest(), 'reason': 'Anonymous response cookie value not retained or reused; attributes preserved.'})
            headers.append([key, value])
        record = {'url': url, 'finalUrl': response.url, 'checkedAt': checked, 'status': response.status, 'headers': dict(headers), 'rawHeaders': headers, 'redactions': redactions, 'bodyStatus': 'NOT_READ', 'bytes': None, 'sha256': None}
        requests.append(record)
        data = response.read() if read_body else None
        if data is not None:
            record.update(bodyStatus='READ', bytes=len(data), sha256=hashlib.sha256(data).hexdigest())
        return data

def capture():
    release = json.loads(get('https://registry.npmjs.org/dayjs/1.11.23'))
    assert release['name'] == 'dayjs' and release['version'] == '1.11.23'
    obj = json.loads(get('https://api.github.com/repos/iamkun/dayjs/git/ref/tags/v1.11.23'))['object']
    while obj['type'] == 'tag':
        obj = json.loads(get(obj['url']))['object']
    assert obj['type'] == 'commit'
    tag_commit = obj['sha']
    commit = release.get('gitHead') or tag_commit
    assert commit == tag_commit
    assert re.fullmatch('[0-9a-f]{40}', commit)
    tree = json.loads(get(f'https://api.github.com/repos/iamkun/dayjs/git/trees/{commit}?recursive=1'))
    assert tree['truncated'] is False
    candidates = [item['path'] for item in tree['tree'] if item['type'] == 'blob' and item['path'].split('/')[-1].lower().startswith('readme')]
    chinese = [path for path in candidates if re.search(r'zh[-_]cn|zh[-_]hans|中文', path, re.I)]
    path = sorted(chinese, key=lambda value: (value.count('/'), value))[0] if chinese else 'README.md'
    assert path in candidates and 'README.md' in candidates
    base = f'https://raw.githubusercontent.com/iamkun/dayjs/{commit}/'
    manifest = json.loads(get(base + 'package.json'))
    assert manifest['name'] == 'dayjs' and isinstance(manifest['version'], str)
    package_readme = get(base + 'README.md')
    original = get(base + urllib.parse.quote(path, safe='/')) if path != 'README.md' else package_readme
    assert original and not original.lstrip().startswith(b'<!DOCTYPE')
    # Prefer the official Chinese documentation link actually present in the chosen README.
    links = re.findall(r'https://day\.js\.org/[^\s)>"\]]+', original.decode())
    chinese_links = [link for link in links if '/zh-CN/' in link or '/zh-cn/' in link]
    homepage = chinese_links[0] if chinese_links else manifest['homepage']
    get(homepage, read_body=False)
    home_record = requests[-1]
    headers = {key.lower(): value for key, value in home_record['headers'].items()}
    ancestors = re.search(r'(?:^|;)\s*frame-ancestors\s+([^;]+)', headers.get('content-security-policy', ''))
    blocked = bool(ancestors and ancestors[1].strip() in ["'none'", "'self'"]) or bool(not ancestors and headers.get('x-frame-options', '').upper() in ['DENY', 'SAMEORIGIN'])
    evidence = {'repository': 'iamkun/dayjs', 'version': '1.11.23', 'commit': commit, 'tag': 'v1.11.23', 'tagCommit': tag_commit, 'versionBasis': {'publishedVersion': release['version'], 'installedVersion': '1.11.23', 'sourceManifestVersion': manifest['version'], 'reason': 'Registry gitHead and official release tag bind the fixed source; its development manifest version is retained without alteration.'}, 'release': {key: release.get(key) for key in ['name', 'version', 'gitHead', 'license', 'repository', 'homepage']}, 'manifest': {key: manifest.get(key) for key in ['name', 'version', 'license', 'homepage']}, 'treeTruncated': False, 'readmeCandidates': candidates, 'chineseReadmeCandidates': chinese, 'readme': {'path': path, 'snapshotPath': 'official/readme.md', 'language': 'zh-CN' if chinese else 'en', 'bytes': len(original), 'sha256': hashlib.sha256(original).hexdigest()}, 'packageReadme': {'path': 'README.md', 'snapshotPath': 'official/package-readme.md', 'language': 'en', 'bytes': len(package_readme), 'sha256': hashlib.sha256(package_readme).hexdigest()}, 'homepage': {'url': homepage, 'declaredHomepage': manifest['homepage'], 'selectionReason': 'Official Chinese documentation URL actually linked by the matching original README.' if chinese_links else 'No Chinese day.js.org URL in the matching original; use declared official homepage.', 'status': 'blocked' if blocked else 'unknown', 'checkedAt': home_record['checkedAt'], 'browserFromLabOrigin': 'NOT_RUN', 'reason': 'Enforced final response headers restrict cross-origin framing.' if blocked else 'Full response headers alone do not prove a usable Lab-origin iframe.'}, 'requests': requests, 'syncedAt': datetime.datetime.now(datetime.timezone.utc).isoformat()}
    serialized = json.dumps(evidence, ensure_ascii=False, indent=2) + '\n'
    OFFICIAL.mkdir(exist_ok=True)
    # All acquisitions/validations finish before any successful artifact is staged or replaced.
    with tempfile.TemporaryDirectory(prefix='.source-capture-', dir=OFFICIAL) as directory:
        staging = Path(directory)
        (staging / 'readme.md').write_bytes(original)
        (staging / 'package-readme.md').write_bytes(package_readme)
        (staging / 'source-evidence.json').write_text(serialized)
        for name in ['readme.md', 'package-readme.md', 'source-evidence.json']:
            (staging / name).replace(OFFICIAL / name)
    print(json.dumps({key: evidence[key] for key in ['commit', 'readme', 'packageReadme', 'homepage']}, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    try:
        capture()
    except Exception as error:
        (ENTRY / 'validation/source-evidence.failed.json').write_text(json.dumps({'failure': {'url': attempted_url, 'type': type(error).__name__, 'message': str(error)}, 'requests': requests}, ensure_ascii=False, indent=2) + '\n')
        raise
