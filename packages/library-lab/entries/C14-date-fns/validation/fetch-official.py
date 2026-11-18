"""Anonymous fixed-version capture; acquire all bytes before staged replacement."""
import datetime, hashlib, json, tempfile, urllib.request, urllib.parse
from pathlib import Path

ENTRY = Path(__file__).resolve().parents[1]
OFFICIAL = ENTRY / 'official'
OFFICIAL.mkdir(exist_ok=True)
e = {'repository': 'date-fns/date-fns', 'requests': []}
attempted_url = None

def get(url, body=True):
    global attempted_url
    attempted_url = url
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'ReactLoom-Library-Lab-source-audit'}), timeout=25) as response:
        raw_headers = []
        for key, value in response.headers.items():
            if key.lower() == 'set-cookie':
                pieces = value.split(';', 1)
                value = '<REDACTED_PUBLIC_COOKIE_SHA256:' + hashlib.sha256(pieces[0].encode()).hexdigest() + '>' + (';' + pieces[1] if len(pieces) > 1 else '')
            raw_headers.append([key, value])
        record = {'url': url, 'finalUrl': response.url, 'status': response.status, 'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'headers': dict(raw_headers), 'rawHeaders': raw_headers, 'bodyStatus': 'NOT_READ', 'bytes': None, 'sha256': None}
        e['requests'].append(record)
        data = response.read() if body else None
        if body:
            record.update(bodyStatus='READ', bytes=len(data), sha256=hashlib.sha256(data).hexdigest())
        return data

try:
    e['registry'] = {}
    for name, version in [('date-fns', '4.4.0'), ('@date-fns/tz', '1.5.0')]:
        package = json.loads(get('https://registry.npmjs.org/' + urllib.parse.quote(name, safe='@') + '/' + version))
        assert package['name'] == name and package['version'] == version
        e['registry'][name] = {key: package.get(key) for key in ['name', 'version', 'gitHead', 'license', 'repository', 'homepage']}
    tag = json.loads(get('https://api.github.com/repos/date-fns/date-fns/git/ref/tags/v4.4.0'))
    target = tag['object']
    e['tag'] = {'name': 'v4.4.0', 'object': target}
    while target['type'] == 'tag':
        target = json.loads(get(target['url']))['object']
    assert target['type'] == 'commit' and len(target['sha']) == 40
    e['commit'] = target['sha']
    raw = 'https://raw.githubusercontent.com/date-fns/date-fns/' + e['commit']
    e['manifests'] = {}
    for name, path, version in [('date-fns', 'pkgs/core/package.json', '4.4.0'), ('@date-fns/tz', 'pkgs/tz/package.json', '1.5.0')]:
        manifest = json.loads(get(raw + '/' + path))
        assert manifest['name'] == name and manifest['version'] == version, (name, manifest.get('version'))
        e['manifests'][name] = {'path': path, **{key: manifest.get(key) for key in ['name', 'version', 'license', 'repository']}}
    tree = json.loads(get('https://api.github.com/repos/date-fns/date-fns/git/trees/' + e['commit'] + '?recursive=1'))
    assert tree['truncated'] is False
    e['treeTruncated'] = False
    e['readmeCandidates'] = [item['path'] for item in tree['tree'] if item['type'] == 'blob' and 'readme' in item['path'].lower()]
    e['preferredReadmeCandidates'] = [path for path in e['readmeCandidates'] if '/' not in path or path.startswith(('pkgs/core/', 'pkgs/tz/'))]
    chinese = [path for path in e['preferredReadmeCandidates'] if any(token in path.lower() for token in ['zh', '中文', 'readme_cn', 'readme.cn'])]
    assert not chinese, 'Review new official Chinese candidates before selecting snapshots'
    e['readmes'] = {}
    artifacts = {}
    for name, path, snapshot in [('date-fns', 'README.md', 'readme.md'), ('@date-fns/tz', 'pkgs/tz/README.md', 'tz-readme.md')]:
        assert path in e['readmeCandidates']
        data = get(raw + '/' + path)
        e['readmes'][name] = {'path': path, 'snapshotPath': 'official/' + snapshot, 'language': 'en', 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
        artifacts[snapshot] = data
    get('https://date-fns.org/', body=False)
    response = e['requests'][-1]
    headers = {key.lower(): value for key, value in response['rawHeaders']}
    csp = headers.get('content-security-policy')
    xfo = headers.get('x-frame-options')
    blocked = bool((csp and ("frame-ancestors 'self'" in csp or "frame-ancestors 'none'" in csp)) or (not (csp and 'frame-ancestors' in csp) and xfo and xfo.upper() in ['DENY', 'SAMEORIGIN']))
    e['homepage'] = {'url': response['url'], 'requestIndex': len(e['requests']) - 1, 'status': 'blocked' if blocked else 'unknown', 'xFrameOptions': xfo, 'contentSecurityPolicy': csp, 'browserFromLabOrigin': 'NOT_RUN', 'reason': '依据最终完整原始响应头；官网正文未读取，未从Lab origin浏览器确认可嵌入。'}
except Exception as error:
    e['syncedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    e['failure'] = {'url': attempted_url, 'type': type(error).__name__, 'message': str(error)}
    (OFFICIAL / 'source-evidence.failed.json').write_text(json.dumps(e, ensure_ascii=False, indent=2) + '\n')
    raise
else:
    e['syncedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    artifacts['source-evidence.json'] = (json.dumps(e, ensure_ascii=False, indent=2) + '\n').encode()
    with tempfile.TemporaryDirectory(prefix='.source-capture-', dir=OFFICIAL) as staging:
        for filename, data in artifacts.items():
            (Path(staging) / filename).write_bytes(data)
        for filename in artifacts:
            (Path(staging) / filename).replace(OFFICIAL / filename)
    print(json.dumps({key: e[key] for key in ['commit', 'manifests', 'readmes', 'preferredReadmeCandidates', 'homepage']}, ensure_ascii=False, indent=2))
