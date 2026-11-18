from pathlib import Path
import urllib.request, json, hashlib, datetime
root = Path(__file__).resolve().parents[1]
ref = 'e995b061e9fc5476a6d862cd2fb2ebc7452ca012'
evidence = {'repository': 'leeoniya/uPlot', 'tag': '1.6.32', 'commit': ref, 'browserFromLabOrigin': 'NOT_RUN', 'requests': []}
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
listing = json.loads(get('https://api.github.com/repos/leeoniya/uPlot/contents/?ref=' + ref))
evidence['readmeCandidates'] = [x['path'] for x in listing if x['type'] == 'file' and x['name'].lower().startswith('readme') and x['name'].lower().endswith('.md')]
evidence.update(chosenReadme='README.md', language='en', reason='Fixed-ref official root listing has no Chinese README candidate; preserve the original root English README.')
raw = get('https://raw.githubusercontent.com/leeoniya/uPlot/' + ref + '/README.md')
(root / 'official/readme.md').write_bytes(raw)
evidence['packageVersion'] = json.loads(get('https://raw.githubusercontent.com/leeoniya/uPlot/' + ref + '/package.json'))['version']
get('https://github.com/leeoniya/uPlot', body=False)
headers = {k.lower(): v for k, v in evidence['requests'][-1]['headers'].items()}
evidence['homepagePolicyHeaders'] = {'x-frame-options': headers.get('x-frame-options'), 'content-security-policy': headers.get('content-security-policy')}
evidence['checkedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
save()
print(json.dumps({k: v for k, v in evidence.items() if k != 'requests'}, ensure_ascii=False, indent=2))
print('README', len(raw), hashlib.sha256(raw).hexdigest())
