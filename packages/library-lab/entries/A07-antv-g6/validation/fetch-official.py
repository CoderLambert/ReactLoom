from pathlib import Path
import urllib.request, json, hashlib, datetime
root = Path(__file__).resolve().parents[1]
ref = '5a5551cea13d021d12c90a87116e3c6092d53210'
evidence = {'repository': 'antvis/G6', 'tag': '5.1.1', 'commit': ref, 'browserFromLabOrigin': 'NOT_RUN', 'requests': []}
output = root / 'official/source-evidence.json'
def save():
    output.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')
def get(url, body=True):
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'ReactLoom-Library-Lab-quality/1.0'}), timeout=25) as response:
        item = {'url': url, 'finalUrl': response.url, 'status': response.status, 'headers': dict(response.headers)}
        evidence['requests'].append(item)
        save()
        if not body:
            item['body'] = 'NOT_READ: full homepage GET headers captured; no body digest claimed'
            save()
            return b''
        data = response.read()
        item.update(bytes=len(data), sha256=hashlib.sha256(data).hexdigest())
        save()
        return data
listing = json.loads(get('https://api.github.com/repos/antvis/G6/contents/?ref=' + ref))
evidence['readmeCandidates'] = [x['path'] for x in listing if x['type'] == 'file' and x['name'].lower().startswith('readme') and x['name'].lower().endswith('.md')]
evidence.update(chosenReadme='README.zh-CN.md', language='zh-CN', reason='Official simplified Chinese README exists at the matching release commit; preserve the upstream original.')
raw = get('https://raw.githubusercontent.com/antvis/G6/' + ref + '/README.zh-CN.md')
(root / 'official/readme.md').write_bytes(raw)
# G6 is a monorepo; the release root package may be a workspace rather than the target SDK.
for path in ['packages/g6/package.json', 'package.json']:
    try:
        package = json.loads(get('https://raw.githubusercontent.com/antvis/G6/' + ref + '/' + path))
        if package.get('name') == '@antv/g6':
            evidence['packageVersion'] = package['version']
            evidence['packagePath'] = path
            break
    except Exception as error:
        evidence.setdefault('failedAttempts', []).append({'path': path, 'error': repr(error)})
assert evidence.get('packageVersion') == '5.1.1', evidence.get('packageVersion')
get('https://g6.antv.antgroup.com/', body=False)
headers = {k.lower(): v for k, v in evidence['requests'][-1]['headers'].items()}
evidence['homepagePolicyHeaders'] = {'x-frame-options': headers.get('x-frame-options'), 'content-security-policy': headers.get('content-security-policy')}
evidence['checkedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
save()
print(json.dumps({k: v for k, v in evidence.items() if k != 'requests'}, ensure_ascii=False, indent=2))
print('README', len(raw), hashlib.sha256(raw).hexdigest())
