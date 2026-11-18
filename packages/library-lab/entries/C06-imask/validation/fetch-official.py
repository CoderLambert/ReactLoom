"""Anonymous pinned upstream evidence; never replace successful snapshots on a failed fetch."""
from pathlib import Path
import datetime
import hashlib
import json
import re
import urllib.request

ENTRY = Path(__file__).resolve().parents[1]
requests = []
def get(url, read_body=True):
    started = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'ReactLoom-Library-Lab-source-audit'}), timeout=30) as response:
        body = response.read() if read_body else None
        headers = dict(response.headers)
        redactions = []
        for key, value in headers.items():
            if key.lower() == 'set-cookie':
                cookie, separator, attributes = value.partition(';')
                name, _, secret = cookie.partition('=')
                headers[key] = name + '=<REDACTED_PUBLIC_SESSION_COOKIE>' + (separator + attributes if separator else '')
                redactions.append({'header': key, 'valueSha256': hashlib.sha256(secret.encode()).hexdigest(), 'reason': 'Anonymous response cookie value not retained or reused; header attributes preserved.'})
        item = {'url': url, 'finalUrl': response.url, 'status': response.status, 'checkedAt': started, 'headers': headers, 'bodyStatus': 'READ' if read_body else 'NOT_READ'}
        if body is not None:
            item.update({'bytes': len(body), 'sha256': hashlib.sha256(body).hexdigest()})
        if redactions:
            item['redactions'] = redactions
        requests.append(item)
        return body

def capture():
    releases = {}
    for name in ['imask', 'react-imask']:
        data = json.loads(get(f'https://registry.npmjs.org/{name}/7.6.1'))
        assert data['version'] == '7.6.1'
        releases[name] = {key: data.get(key) for key in ['name', 'version', 'gitHead', 'license', 'repository', 'peerDependencies']}
    tag = json.loads(get('https://api.github.com/repos/uNmAnNeR/imaskjs/git/ref/tags/v7.6.1'))
    obj = tag['object']
    if obj['type'] == 'tag':
        obj = json.loads(get('https://api.github.com/repos/uNmAnNeR/imaskjs/git/tags/' + obj['sha']))['object']
    assert obj['type'] == 'commit' and re.fullmatch('[0-9a-f]{40}', obj['sha'])
    commit = obj['sha']
    tree = json.loads(get(f'https://api.github.com/repos/uNmAnNeR/imaskjs/git/trees/{commit}?recursive=1'))
    assert tree['truncated'] is False
    candidates = [item['path'] for item in tree['tree'] if 'readme' in item['path'].lower()]
    chosen = {}
    snapshots = {}
    for name in ['react-imask', 'imask']:
        manifest_path = f'packages/{name}/package.json'
        manifest = json.loads(get(f'https://raw.githubusercontent.com/uNmAnNeR/imaskjs/{commit}/{manifest_path}'))
        assert manifest['name'] == name and manifest['version'] == '7.6.1'
        eligible = [path for path in candidates if path.startswith(f'packages/{name}/README')]
        chinese = [path for path in eligible if 'zh' in path.lower() or '中文' in path]
        path = chinese[0] if chinese else f'packages/{name}/README.md'
        assert path in candidates
        data = get(f'https://raw.githubusercontent.com/uNmAnNeR/imaskjs/{commit}/{path}')
        assert data and not data.lstrip().startswith(b'<!DOCTYPE')
        output = 'readme.md' if name == 'react-imask' else 'core-readme.md'
        snapshots[output] = data
        chosen[name] = {'path': path, 'snapshotPath': 'official/' + output, 'language': 'zh-CN' if chinese else 'en', 'manifest': {key: manifest.get(key) for key in ['name', 'version', 'license', 'peerDependencies']}, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
    get('https://imask.js.org/', read_body=False)
    homepage = requests[-1]
    headers = {key.lower(): value for key, value in homepage['headers'].items()}
    xfo = headers.get('x-frame-options', '')
    csp = headers.get('content-security-policy', '')
    blocked = xfo.upper() in ['DENY', 'SAMEORIGIN'] or bool(re.search(r"frame-ancestors\s+(?:'self'|'none')\s*(?:;|$)", csp))
    evidence = {'repository': 'uNmAnNeR/imaskjs', 'tag': 'v7.6.1', 'commit': commit, 'version': '7.6.1', 'releases': releases, 'treeTruncated': False, 'readmeCandidates': candidates, 'selectionReason': 'Exact React package README preferred; preserve core package README separately. No translation substituted for originals.', 'readmes': chosen, 'requests': requests, 'homepage': {'url': homepage['url'], 'status': 'blocked' if blocked else 'unknown', 'reason': 'Actual complete GET headers restrict cross-origin framing.' if blocked else 'No enforced framing restriction observed in complete GET headers; actual Lab-origin browser NOT_RUN.', 'checkedAt': homepage['checkedAt'], 'browserFromLabOrigin': 'NOT_RUN'}, 'syncedAt': datetime.datetime.now(datetime.timezone.utc).isoformat()}
    official = ENTRY / 'official'
    official.mkdir(exist_ok=True)
    for path, data in snapshots.items():
        (official / path).write_bytes(data)
    (official / 'source-evidence.json').write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'commit': commit, 'readmes': chosen, 'homepage': evidence['homepage'], 'requests': len(requests)}, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    try:
        capture()
    except Exception as error:
        (ENTRY / 'validation/source-fetch-failure.json').write_text(json.dumps({'error': str(error), 'requests': requests}, ensure_ascii=False, indent=2) + '\n')
        raise
