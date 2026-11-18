from pathlib import Path
import urllib.request
import json
import hashlib
import datetime

entry = Path(__file__).resolve().parents[1]
official = entry / 'official'
official.mkdir(exist_ok=True)
ref = '1c3f8b4903f21cfad12c102edb3db4ceba2e8c8c'
evidence = {'repository': 'mui/material-ui', 'tag': 'v9.5.0',
            'tagObject': 'd4366b2c20b69195dfcf487dbfb5bbef69fedb83',
            'commit': ref, 'package': '@mui/material', 'browserFromLabOrigin': 'NOT_RUN', 'requests': []}


def save():
    evidence['checkedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    (official / 'source-evidence.json').write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')


def get(url, body=True):
    record = {'url': url}
    evidence['requests'].append(record)
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'ReactLoomQuality'}), timeout=25) as response:
            record.update(finalUrl=response.url, status=response.status, headers=dict(response.headers.items()))
            content = response.read() if body else None
            if content is not None:
                record.update(bytes=len(content), sha256=hashlib.sha256(content).hexdigest())
            else:
                record['body'] = 'NOT_READ: complete GET headers only'
            save()
            return content
    except Exception as error:
        record['error'] = repr(error)
        save()
        raise


root = json.loads(get('https://api.github.com/repos/mui/material-ui/contents/?ref=' + ref))
target = json.loads(get('https://api.github.com/repos/mui/material-ui/contents/packages/mui-material?ref=' + ref))
candidates = [item['path'] for item in [*root, *target] if 'readme' in item['name'].lower()]
evidence['readmeCandidates'] = candidates
chinese = [path for path in candidates if any(key in path.lower() for key in ['zh-cn', 'zh_cn', 'chinese'])]
chosen = chinese[0] if chinese else ('packages/mui-material/README.md' if 'packages/mui-material/README.md' in candidates else 'README.md')
evidence.update(chosenReadme=chosen, language='zh-CN' if chinese else 'en',
                selectionReason='Inspected release root and target package; upstream Chinese first, otherwise exact target-package original.')
raw = get('https://raw.githubusercontent.com/mui/material-ui/' + ref + '/' + chosen)
(official / 'readme.md').write_bytes(raw)
package = json.loads(get('https://raw.githubusercontent.com/mui/material-ui/' + ref + '/packages/mui-material/package.json'))
assert package['version'] == '9.5.0'
evidence['packageVersion'] = package['version']
evidence['reactPeers'] = package['peerDependencies']
get('https://mui.com/material-ui/', False)
homepage = evidence['requests'][-1]
headers = {key.lower(): value for key, value in homepage['headers'].items()}
evidence['homepagePolicyHeaders'] = {key: headers.get(key) for key in ['x-frame-options', 'content-security-policy']}
save()
print(json.dumps({key: value for key, value in evidence.items() if key != 'requests'}, ensure_ascii=False, indent=2))
print('README', len(raw), hashlib.sha256(raw).hexdigest())
