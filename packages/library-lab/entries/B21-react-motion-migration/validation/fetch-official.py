"""Fixed modern runtime sources and a read-only historical migration reference."""
import datetime
import hashlib
import json
from pathlib import Path
import urllib.request

ENTRY = Path(__file__).resolve().parents[1]
OFFICIAL = ENTRY / 'official'
OFFICIAL.mkdir(exist_ok=True)
MODERN = 'c624ce8e907d5668280b8c832f2ab93ba3462ab5'
LEGACY = '8bd4f7223a8d79535586220f7173f078d4604e07'
requests = []


def get(url):
    started = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with urllib.request.urlopen(urllib.request.Request(url, headers={
        'User-Agent': 'ReactLoom-Library-Lab-source-audit',
    }), timeout=30) as response:
        data = response.read()
        requests.append({'url': url, 'finalUrl': response.url, 'status': response.status,
                         'checkedAt': started, 'headers': dict(response.headers),
                         'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
    return data


def capture(repository, commit, package_path, version, registry_name, snapshot):
    registry = json.loads(get(f'https://registry.npmjs.org/{registry_name}/{version}'))
    assert registry['gitHead'] == commit and registry['version'] == version
    raw = f'https://raw.githubusercontent.com/{repository}/{commit}'
    manifest = json.loads(get(f'{raw}/{package_path}'))
    tree = json.loads(get(f'https://api.github.com/repos/{repository}/git/trees/{commit}?recursive=1'))
    assert tree['truncated'] is False
    candidates = [item['path'] for item in tree['tree'] if 'readme' in item['path'].lower()]
    assert not any('zh' in path.lower() or '中文' in path for path in candidates)
    data = get(f'{raw}/README.md')
    (OFFICIAL / snapshot).write_bytes(data)
    return {'repository': repository, 'commit': commit, 'path': 'README.md',
            'version': version, 'language': 'en', 'snapshotPath': f'official/{snapshot}',
            'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(),
            'registry': {key: registry.get(key) for key in ['name', 'version', 'gitHead', 'peerDependencies', 'license']},
            'manifest': {key: manifest.get(key) for key in ['name', 'version', 'peerDependencies', 'license']},
            'treeTruncated': False, 'readmeCandidates': candidates}


evidence = {'requests': requests}
try:
    evidence['modern'] = capture('motiondivision/motion', MODERN,
                                  'packages/motion/package.json', '14.6.0', 'motion', 'readme.md')
    assert evidence['modern']['manifest']['version'] == '14.6.0'
    evidence['legacy'] = capture('chenglou/react-motion', LEGACY,
                                  'package.json', '0.5.2', 'react-motion', 'legacy-readme.md')
    evidence['legacy']['runtimeStatus'] = 'NOT_RUN'
    evidence['legacy']['note'] = '只下载官方资料供迁移对照，未安装、导入或执行旧SDK；React19未获该旧peer支持。'
    get('https://motion.dev/')
    headers = {key.lower(): value for key, value in requests[-1]['headers'].items()}
    evidence['homepage'] = {'requestIndex': len(requests) - 1, 'status': 'unknown',
                            'xFrameOptions': headers.get('x-frame-options'),
                            'contentSecurityPolicy': headers.get('content-security-policy'),
                            'reason': '实际GET200完整头未见XFO/CSP，尚未从Lab origin确认iframe可用，保持unknown。'}
finally:
    evidence['syncedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    (OFFICIAL / 'source-evidence.json').write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')
print(f'B21 modern14.6.0 original README {evidence["modern"]["bytes"]}B; historical0.5.2 reference {evidence["legacy"]["bytes"]}B, old SDK NOT_RUN; {len(requests)} full headers')
