from pathlib import Path
import urllib.request, json, hashlib, datetime
root = Path(__file__).resolve().parents[1]
ref = '12d94738472e922e1b3fa31b02b2b61b9ed77e6a'
evidence = {'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'repository': 'floating-ui/floating-ui', 'tag': '@floating-ui/react@0.27.20', 'tagObject': 'fdeee8bf99a34f88ebe9801f56b42144ad5a9885', 'commit': ref, 'browserFromLabOrigin': 'NOT_RUN', 'failedAttempts': [{'operation': 'initial recursive tree GET', 'error': 'RemoteDisconnected: Remote end closed connection without response'}, {'operation': 'initial multi-resource fetch', 'error': 'TimeoutError while reading response body; no complete source-evidence saved by that attempt'}], 'requests': []}
output = root / 'official/source-evidence.json'
def save():
    output.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')
def get(url, body=True):
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'ReactLoom-Library-Lab-quality/1.0'}), timeout=25) as response:
        item = {'url': url, 'finalUrl': response.url, 'status': response.status, 'headers': dict(response.headers)}
        evidence['requests'].append(item)
        save()
        if not body:
            item['body'] = 'NOT_READ: homepage GET headers are the framing evidence; no body digest claimed'
            save()
            return b''
        data = response.read()
        item.update(bytes=len(data), sha256=hashlib.sha256(data).hexdigest())
        save()
        return data
root_list = json.loads(get('https://api.github.com/repos/floating-ui/floating-ui/contents/?ref=' + ref))
package_list = json.loads(get('https://api.github.com/repos/floating-ui/floating-ui/contents/packages/react?ref=' + ref))
evidence['readmeCandidates'] = [x['path'] for x in root_list + package_list if x['type'] == 'file' and x['name'].lower().startswith('readme') and x['name'].lower().endswith('.md')]
evidence.update(chosenReadme='README.md', language='en', reason='No Chinese root/React-package README at this ref. React-package README is a 73-byte introduction; choose the substantive official root README at the matching React release commit.')
readme = get('https://raw.githubusercontent.com/floating-ui/floating-ui/' + ref + '/README.md')
(root / 'official/readme.md').write_bytes(readme)
evidence['packageVersion'] = json.loads(get('https://raw.githubusercontent.com/floating-ui/floating-ui/' + ref + '/packages/react/package.json'))['version']
get('https://floating-ui.com/docs/react', body=False)
headers = {k.lower(): v for k, v in evidence['requests'][-1]['headers'].items()}
evidence['homepagePolicyHeaders'] = {'x-frame-options': headers.get('x-frame-options'), 'content-security-policy': headers.get('content-security-policy')}
evidence['checkedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
save()
print(json.dumps({k: v for k, v in evidence.items() if k != 'requests'}, ensure_ascii=False, indent=2))
print('README', len(readme), hashlib.sha256(readme).hexdigest())
print('HOMEPAGE', evidence['requests'][-1]['status'], evidence['requests'][-1]['finalUrl'], evidence['homepagePolicyHeaders'])
