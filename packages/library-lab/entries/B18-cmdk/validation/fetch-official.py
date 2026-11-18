"""Capture public matching cmdk sources. Does not install packages or read credentials."""
import datetime
import hashlib
import json
from pathlib import Path
import urllib.request

ENTRY = Path(__file__).resolve().parents[1]
OFFICIAL = ENTRY / 'official'
OFFICIAL.mkdir(exist_ok=True)
COMMIT = 'fb4ea04e9ec211777fbb39c6104e3c5f2ee107d2'
requests = []


def get(url):
    started = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'ReactLoom-Library-Lab-source-audit'}), timeout=30) as response:
        data = response.read()
        requests.append({'url': url, 'finalUrl': response.url, 'status': response.status,
                         'checkedAt': started, 'headers': dict(response.headers),
                         'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
        return data


evidence = {'repository': 'dip/cmdk', 'legacyRepository': 'pacocoursey/cmdk',
            'tag': 'v1.1.1', 'commit': COMMIT, 'requests': requests}
complete = False
try:
    tag = json.loads(get('https://api.github.com/repos/dip/cmdk/git/ref/tags/v1.1.1'))
    assert tag['object']['sha'] == COMMIT and tag['object']['type'] == 'commit'
    tree = json.loads(get(f'https://api.github.com/repos/dip/cmdk/git/trees/{COMMIT}?recursive=1'))
    assert tree['truncated'] is False
    candidates = [item['path'] for item in tree['tree'] if item['type'] == 'blob' and Path(item['path']).name.lower().startswith('readme')]
    evidence['tree'] = {'truncated': False, 'readmeCandidates': candidates}
    package = json.loads(get(f'https://raw.githubusercontent.com/dip/cmdk/{COMMIT}/cmdk/package.json'))
    assert package['name'] == 'cmdk' and package['version'] == '1.1.1'
    evidence['package'] = {key: package[key] for key in ['name', 'version', 'license', 'repository', 'homepage', 'peerDependencies', 'dependencies']}
    readme = get(f'https://raw.githubusercontent.com/dip/cmdk/{COMMIT}/README.md')
    assert len(readme) == 14036 and hashlib.sha256(readme).hexdigest() == '3c91f31f521a1f6dc077c0faaa0ecd42aa0bf89ed6e2e76267b4f21fc6198cb4'
    evidence['readme'] = {'path': 'README.md', 'language': 'en', 'bytes': len(readme), 'sha256': hashlib.sha256(readme).hexdigest()}
    get(package['homepage'])
    evidence['homepage'] = {'requestIndex': len(requests) - 1, 'status': 'blocked',
                           'reason': '包声明的旧GitHub主页实际重定向官方dip/cmdk；最终GET200，XFO deny与强制CSP frame-ancestors none明确禁止Lab跨源嵌入。保留官网直达。'}
    assert 'github.com/dip/cmdk' in requests[-1]['finalUrl']
    (OFFICIAL / 'readme.md').write_bytes(readme)
    complete = True
finally:
    evidence['syncedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    destination = 'source-evidence.json' if complete else 'source-attempt-failed.json'
    (OFFICIAL / destination).write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')
print(f'B18 official1.1.1 README14036B saved; {len(requests)} public GETs; candidates={candidates}')
