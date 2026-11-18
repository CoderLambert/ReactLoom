"""Public fixed replacement README plus separately labelled legacy provenance; no install."""
import datetime
import hashlib
import json
from pathlib import Path
import urllib.request

ENTRY = Path(__file__).resolve().parents[1]
OFFICIAL = ENTRY / 'official'
OFFICIAL.mkdir(exist_ok=True)
COMMIT = '410173402853654f64436d116d68e3f89359d496'
requests = []


def get(url):
    checked = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'ReactLoom-Library-Lab-source-audit'}), timeout=30) as response:
        body = response.read()
        headers = dict(response.headers)
        redactions = []
        for key, value in list(headers.items()):
            if key.lower() == 'set-cookie':
                head, sep, tail = value.partition(';')
                name, _, cookie = head.partition('=')
                headers[key] = name + '=<REDACTED_PUBLIC_SESSION_COOKIE>' + sep + tail
                redactions.append({'header': key, 'reason': 'anonymous server-issued cookie value; never sent/reused', 'valueSha256': hashlib.sha256(cookie.encode()).hexdigest()})
        requests.append({'url': url, 'finalUrl': response.url, 'checkedAt': checked,
                         'status': response.status, 'headers': headers, 'headerRedactions': redactions,
                         'bytes': len(body), 'sha256': hashlib.sha256(body).hexdigest()})
        return body


evidence = {'repository': 'hello-pangea/dnd', 'tag': 'v18.0.1', 'commit': COMMIT,
            'executedPackage': '@hello-pangea/dnd', 'legacyExecuted': False, 'requests': requests}
complete = False
try:
    tag = json.loads(get('https://api.github.com/repos/hello-pangea/dnd/git/ref/tags/v18.0.1'))
    tagged = json.loads(get(tag['object']['url']))
    assert tagged['object']['sha'] == COMMIT and tagged['object']['type'] == 'commit'
    repo = json.loads(get('https://api.github.com/repos/hello-pangea/dnd'))
    evidence['repositoryHomepage'] = repo.get('homepage')
    tree = json.loads(get(f'https://api.github.com/repos/hello-pangea/dnd/git/trees/{COMMIT}?recursive=1'))
    assert tree['truncated'] is False
    evidence['tree'] = {'truncated': False, 'readmeCandidates': [item['path'] for item in tree['tree'] if item['type'] == 'blob' and Path(item['path']).name.lower().startswith('readme')]}
    package = json.loads(get(f'https://raw.githubusercontent.com/hello-pangea/dnd/{COMMIT}/package.json'))
    assert package['name'] == '@hello-pangea/dnd' and package['version'] == '18.0.1'
    evidence['package'] = {key: package.get(key) for key in ['name', 'version', 'license', 'peerDependencies', 'repository', 'homepage']}
    readme = get(f'https://raw.githubusercontent.com/hello-pangea/dnd/{COMMIT}/README.md')
    assert len(readme) == 10875 and hashlib.sha256(readme).hexdigest() == 'cb8eefef4209f565a8f57e27bcd107d9ea4a59e8b86d22a1c03c24e311436851'
    evidence['readme'] = {'path': 'README.md', 'language': 'en', 'bytes': len(readme), 'sha256': hashlib.sha256(readme).hexdigest()}
    legacy = json.loads(get('https://registry.npmjs.org/react-beautiful-dnd/13.1.1'))
    archived = json.loads(get('https://api.github.com/repos/atlassian/react-beautiful-dnd'))
    legacy_commit = legacy['gitHead']
    legacy_readme = get(f'https://raw.githubusercontent.com/atlassian/react-beautiful-dnd/{legacy_commit}/README.md')
    evidence['legacy'] = {'repository': 'atlassian/react-beautiful-dnd', 'version': legacy['version'],
                          'commit': legacy_commit, 'path': 'README.md', 'language': 'en',
                          'license': legacy['license'], 'peerDependencies': legacy['peerDependencies'],
                          'deprecated': legacy.get('deprecated'), 'archived': archived['archived'],
                          'snapshotPath': 'official/legacy-readme.md', 'bytes': len(legacy_readme),
                          'sha256': hashlib.sha256(legacy_readme).hexdigest(), 'executed': False}
    homepage = repo.get('homepage') or 'https://github.com/hello-pangea/dnd'
    try:
        get(homepage)
        current = requests[-1]
        headers = {key.lower(): value for key, value in current['headers'].items()}
        csp = headers.get('content-security-policy', '')
        xfo = headers.get('x-frame-options', '').lower()
        restrictive = "frame-ancestors 'none'" in csp or "frame-ancestors 'self'" in csp
        blocked = restrictive or ('frame-ancestors' not in csp and xfo in ['deny', 'sameorigin'])
        evidence['homepage'] = {'url': homepage, 'kind': 'website' if repo.get('homepage') else 'repository',
            'requestIndex': len(requests) - 1, 'status': 'blocked' if blocked else 'unknown',
            'reason': '最终公开响应有强制frame-ancestors或XFO跨源限制，提供直达。' if blocked else '公开请求与完整最终响应头已保存；未从Lab origin确认iframe内容可用，因此unknown并保留直达/重试。'}
    except Exception as error:
        evidence['homepage'] = {'url': homepage, 'kind': 'website' if repo.get('homepage') else 'repository',
            'status': 'unknown', 'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'error': str(error),
            'reason': '公开首页请求未完成；不推断嵌入允许或禁止，保留unknown与直达。'}
    (OFFICIAL / 'readme.md').write_bytes(readme)
    (OFFICIAL / 'legacy-readme.md').write_bytes(legacy_readme)
    complete = True
finally:
    evidence['syncedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    (OFFICIAL / ('source-evidence.json' if complete else 'source-attempt-failed.json')).write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')
print(f'B22 replacement18.0.1 README10875B and separate unexecuted legacy13.1.1 provenance saved; {len(requests)} public GETs; homepage={evidence["homepage"]["status"]}')
