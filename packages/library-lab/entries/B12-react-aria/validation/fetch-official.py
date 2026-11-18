from pathlib import Path
import datetime, hashlib, json, urllib.request

root = Path(__file__).resolve().parent.parent
(root / 'official').mkdir(exist_ok=True)
commit = '0a2a7e68e4d896b3ac46c3647fe48fac9ea3ae2e'
evidence = {'repository': 'adobe/react-spectrum', 'commit': commit, 'package': 'react-aria-components', 'version': '1.21.0', 'browserFromLabOrigin': 'NOT_RUN', 'requests': []}
def persist():
    (root / 'official/source-evidence.json').write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')
def get(url, read_body=True):
    request = urllib.request.Request(url, headers={'User-Agent': 'ReactLoom-LibraryLab-quality', 'Accept': '*/*'})
    with urllib.request.urlopen(request, timeout=30) as response:
        body = response.read() if read_body else None
        record = {'url': url, 'finalUrl': response.url, 'status': response.status, 'headers': dict(response.headers.items()), 'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat()}
        if body is not None:
            record.update(bytes=len(body), sha256=hashlib.sha256(body).hexdigest())
        else:
            record['body'] = 'NOT_READ: complete GET headers only'
        evidence['requests'].append(record)
        persist()
        return body
try:
    release = json.loads(get('https://registry.npmjs.org/react-aria-components/1.21.0'))
    assert release['version'] == '1.21.0' and release['gitHead'] == commit
    evidence['npmRelease'] = {key: release[key] for key in ['name', 'version', 'gitHead', 'license', 'peerDependencies']}
    tree = json.loads(get('https://api.github.com/repos/adobe/react-spectrum/git/trees/' + commit + '?recursive=1'))
    assert tree['truncated'] is False
    candidates = [item['path'] for item in tree['tree'] if item['type'] == 'blob' and 'readme' in Path(item['path']).name.lower()]
    evidence.update(readmeCandidates=candidates, treeTruncated=tree['truncated'], chosenReadme='packages/react-aria-components/README.md', language='en', selectionReason='Full pinned tree inspected. No official Chinese README; exact target-package original takes precedence over monorepo README.')
    assert evidence['chosenReadme'] in candidates
    assert not any(any(token in name.lower() for token in ['zh-cn', 'zh_cn', '.zh.', 'chinese']) for name in candidates)
    raw = 'https://raw.githubusercontent.com/adobe/react-spectrum/' + commit + '/'
    readme = get(raw + evidence['chosenReadme'])
    (root / 'official/readme.md').write_bytes(readme)
    package = json.loads(get(raw + 'packages/react-aria-components/package.json'))
    assert package['version'] == '1.21.0' and package['license'] == 'Apache-2.0'
    evidence['packageVersion'] = package['version']
    evidence['reactPeers'] = package['peerDependencies']
    get('https://react-aria.adobe.com/', read_body=False)
    evidence['syncedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    persist()
    print(json.dumps({key: value for key, value in evidence.items() if key != 'requests'}, ensure_ascii=False, indent=2))
    print('Actual requests:', len(evidence['requests']))
except Exception as error:
    evidence['error'] = repr(error)
    persist()
    raise
