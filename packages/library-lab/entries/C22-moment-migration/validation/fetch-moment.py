import datetime, hashlib, json, pathlib, urllib.request

entry = pathlib.Path(__file__).resolve().parents[1]
requests = []

def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'ReactLoom-Library-Lab-source-audit', 'Accept': 'application/vnd.github+json' if 'api.github.com' in url else '*/*'})
    with urllib.request.urlopen(request, timeout=30) as response:
        body = response.read()
        headers = [(key, '<redacted>') if key.lower() == 'set-cookie' else (key, value) for key, value in response.headers.items()]
        requests.append({'url': url, 'finalUrl': response.url, 'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'status': response.status, 'rawHeaders': headers, 'headers': dict(headers), 'bodyStatus': 'READ', 'bytes': len(body), 'sha256': hashlib.sha256(body).hexdigest(), 'redactions': ['set-cookie'] if any(key.lower() == 'set-cookie' for key, _ in response.headers.items()) else []})
        (entry / 'validation/moment-http-progress.json').write_text(json.dumps(requests, ensure_ascii=False, indent=2) + '\n')
        return body

tag = json.loads(fetch('https://api.github.com/repos/moment/moment/git/ref/tags/2.30.1'))
obj = tag['object']
if obj['type'] == 'tag':
    obj = json.loads(fetch(obj['url']))['object']
if obj['type'] != 'commit':
    raise RuntimeError('Tag did not resolve to a commit')
commit = obj['sha']
release = {'name': 'moment', 'version': '2.30.1', 'gitHead': None, 'note': 'Registry did not expose gitHead in first failed attempt; fixed source is bound by official tag and manifest.'}
tree = json.loads(fetch(f'https://api.github.com/repos/moment/moment/git/trees/{commit}?recursive=1'))
if tree.get('truncated'):
    raise RuntimeError('Refuse README selection from truncated tree')
candidates = [node['path'] for node in tree['tree'] if node['type'] == 'blob' and 'readme' in pathlib.PurePosixPath(node['path']).name.lower()]
if 'README.md' not in candidates:
    raise RuntimeError('Expected actual root README not present')
manifest = json.loads(fetch(f'https://raw.githubusercontent.com/moment/moment/{commit}/package.json'))
assert manifest['version'] == '2.30.1'
readme = fetch(f'https://raw.githubusercontent.com/moment/moment/{commit}/README.md')
(entry / 'official/moment-readme.md').write_bytes(readme)
sources = {}
for name in ['src/lib/moment/to-type.js', 'src/lib/moment/add-subtract.js', 'src/lib/create/check-overflow.js']:
    if not any(node['path'] == name for node in tree['tree']):
        raise RuntimeError('Source path not found in actual tree: ' + name)
    body = fetch(f'https://raw.githubusercontent.com/moment/moment/{commit}/{name}')
    local = 'moment-' + pathlib.PurePosixPath(name).name + '.txt'
    (entry / 'validation' / local).write_bytes(body)
    sources[name] = {'snapshotPath': 'validation/' + local, 'sha256': hashlib.sha256(body).hexdigest(), 'bytes': len(body)}
homepage = fetch('https://momentjs.com/')
evidence = {'repository': 'moment/moment', 'role': 'historical-source-only-no-runtime-dependency', 'version': '2.30.1', 'commit': commit, 'tag': tag, 'release': {key: release.get(key) for key in ['name', 'version', 'gitHead', 'repository', 'homepage', 'license']}, 'manifest': {key: manifest.get(key) for key in ['name', 'version', 'repository', 'homepage', 'license']}, 'treeTruncated': tree['truncated'], 'readmeCandidates': candidates, 'chineseReadmeCandidates': [path for path in candidates if 'zh' in path.lower() or 'chinese' in path.lower()], 'readme': {'path': 'README.md', 'language': 'en', 'snapshotPath': 'official/moment-readme.md', 'bytes': len(readme), 'sha256': hashlib.sha256(readme).hexdigest()}, 'sources': sources, 'requests': requests, 'syncedAt': datetime.datetime.now(datetime.timezone.utc).isoformat()}
(entry / 'official/moment-source-evidence.json').write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({key: evidence[key] for key in ['repository', 'version', 'commit', 'readmeCandidates', 'chineseReadmeCandidates', 'readme']}, ensure_ascii=False, indent=2))
print('real HTTP requests:', len(requests))
