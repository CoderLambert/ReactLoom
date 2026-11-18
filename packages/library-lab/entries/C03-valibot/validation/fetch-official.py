from pathlib import Path
import json, datetime, hashlib, urllib.request, re
root = Path(__file__).resolve().parent.parent
(root / 'official').mkdir(exist_ok=True)
commit = '0dc26ea88cf07a414653375f0da43f97e0eed607'
evidence = {'repository': 'open-circle/valibot', 'commit': commit, 'package': 'valibot', 'version': '1.4.2', 'requests': [], 'browserFromLabOrigin': 'NOT_RUN'}
def persist():
    (root / 'official/source-evidence.json').write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')
def get(url, read_body=True):
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'ReactLoom-LibraryLab-quality'}), timeout=30) as response:
        body = response.read() if read_body else None
        record = {'url': url, 'finalUrl': response.url, 'status': response.status, 'headers': dict(response.headers.items()), 'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat()}
        if body is not None: record.update(bytes=len(body), sha256=hashlib.sha256(body).hexdigest())
        else: record['body'] = 'NOT_READ: complete GET headers only'
        evidence['requests'].append(record); persist(); return body
try:
    release = json.loads(get('https://registry.npmjs.org/valibot/1.4.2'))
    assert release['version'] == '1.4.2' and release['gitHead'] == commit
    evidence['registry'] = {key: release[key] for key in ['name', 'version', 'gitHead', 'license', 'repository']}
    tag = json.loads(get('https://api.github.com/repos/open-circle/valibot/git/ref/tags/v1.4.2'))
    assert tag['object']['type'] == 'commit' and tag['object']['sha'] == commit
    evidence['tag'] = 'v1.4.2'
    tree = json.loads(get('https://api.github.com/repos/open-circle/valibot/git/trees/' + commit + '?recursive=1'))
    assert tree['truncated'] is False
    candidates = [item['path'] for item in tree['tree'] if item['type'] == 'blob' and 'readme' in Path(item['path']).name.lower()]
    assert 'library/README.md' in candidates
    assert not any(any(token in name.lower() for token in ['zh-cn', 'zh_cn', '.zh.', 'chinese']) for name in candidates)
    evidence.update(readmeCandidates=candidates, treeTruncated=False, chosenReadme='library/README.md', language='en', selectionReason='Full pinned tree has no official Chinese README. Prefer exact target library package over monorepo root.')
    raw = 'https://raw.githubusercontent.com/open-circle/valibot/' + commit + '/'
    package = json.loads(get(raw + 'library/package.json'))
    assert package['name'] == 'valibot' and package['version'] == '1.4.2'
    evidence['packageVersion'] = package['version']
    evidence['peerDependencies'] = package.get('peerDependencies', {})
    readme = get(raw + 'library/README.md'); (root / 'official/readme.md').write_bytes(readme)
    get('https://valibot.dev/', read_body=False)
    headers = {key.lower(): value for key, value in evidence['requests'][-1]['headers'].items()}
    csp = headers.get('content-security-policy', '')
    xfo = headers.get('x-frame-options', '').lower()
    ancestors = re.search(r'(?:^|;)\s*frame-ancestors\s+([^;]+)', csp)
    blocked = bool(ancestors and ancestors.group(1).strip() in ["'none'", "'self'"]) or bool(not ancestors and xfo in ['deny', 'sameorigin'])
    evidence['framingEvaluation'] = {'status': 'blocked' if blocked else 'unknown', 'reason': 'Actual enforced framing headers retained; blocked only for an explicit cross-origin restriction. No actual Lab-origin browser confirmation.', 'browserFromLabOrigin': 'NOT_RUN'}
    evidence['syncedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat(); persist()
    print(json.dumps({key: value for key, value in evidence.items() if key != 'requests'}, ensure_ascii=False, indent=2)); print('Actual requests:', len(evidence['requests']))
except Exception as error:
    evidence['error'] = repr(error); persist(); raise
