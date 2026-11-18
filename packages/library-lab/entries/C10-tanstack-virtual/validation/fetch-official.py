"""Fixed TanStack React Virtual source capture; failed attempts never replace successes."""
import datetime
import hashlib
import json
from pathlib import Path
import re
import subprocess
import tempfile
import urllib.request

ENTRY = Path(__file__).resolve().parents[1]
OFFICIAL = ENTRY / 'official'
OFFICIAL.mkdir(exist_ok=True)
requests = []
evidence = {'requests': requests}
attempted_url = None

def get(url, read_body=True):
    global attempted_url
    attempted_url = url
    checked = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'ReactLoom-Library-Lab'}), timeout=30) as response:
        data = response.read() if read_body else None
        requests.append({'url':url,'finalUrl':response.url,'status':response.status,'checkedAt':checked,'headers':dict(response.headers),'bytes':len(data) if data is not None else None,'sha256':hashlib.sha256(data).hexdigest() if data is not None else None,'bodyStatus':'READ' if read_body else 'NOT_READ'})
    return data

try:
    react = json.loads(get('https://registry.npmjs.org/@tanstack%2Freact-virtual/3.14.21'))
    assert react['version'] == '3.14.21' and react['dependencies']['@tanstack/virtual-core'] == '3.19.6'
    assert react.get('gitHead') is None
    core = json.loads(get('https://registry.npmjs.org/@tanstack%2Fvirtual-core/3.19.6'))
    tag = '@tanstack/react-virtual@3.14.21'
    command = ['git','ls-remote','--tags','https://github.com/TanStack/virtual.git',f'refs/tags/{tag}*']
    result = subprocess.run(command, check=True, capture_output=True, text=True, cwd=ENTRY)
    refs = dict((line.split()[1],line.split()[0]) for line in result.stdout.splitlines())
    commit = refs[f'refs/tags/{tag}^{{}}']
    assert commit == '28ff2cab7a970f4e0908229d65a0da8803903900'
    evidence['versionBasis'] = {'reason':'npm React manifest omits gitHead; actual annotated version tag resolved and peeled to commit, then both package versions verified.','tag':tag,'tagObject':refs[f'refs/tags/{tag}'],'commit':commit,'cwd':str(ENTRY),'argv':command,'exit':result.returncode,'stdout':result.stdout}
    raw = f'https://raw.githubusercontent.com/TanStack/virtual/{commit}'
    tree = json.loads(get(f'https://api.github.com/repos/TanStack/virtual/git/trees/{commit}?recursive=1'))
    assert tree['truncated'] is False
    candidates = [item['path'] for item in tree['tree'] if item['type']=='blob' and item['path'].split('/')[-1].lower().startswith('readme')]
    preferred = [name for name in candidates if '/' not in name or name.startswith('packages/react-virtual/README')]
    chinese = [name for name in preferred if re.search(r'zh|中文|README[._-]CN',name,re.I)]
    target = chinese[0] if chinese else ('packages/react-virtual/README.md' if 'packages/react-virtual/README.md' in candidates else 'README.md')
    react_manifest = json.loads(get(f'{raw}/packages/react-virtual/package.json'))
    core_manifest = json.loads(get(f'{raw}/packages/virtual-core/package.json'))
    assert react_manifest['version'] == '3.14.21' and core_manifest['version'] == '3.19.6'
    data = get(f'{raw}/{target}')
    get('https://tanstack.com/virtual', read_body=False)
    headers = {key.lower():value for key,value in requests[-1]['headers'].items()}
    match = re.search(r'(?:^|;)\s*frame-ancestors\s+([^;]+)', headers.get('content-security-policy',''))
    ancestors = match.group(1).strip() if match else None
    sources = ancestors.split() if ancestors else []
    restricted = bool(sources) and all(source in ["'self'","'none'"] or source.startswith('https://') for source in sources)
    if ancestors is None:
        restricted = headers.get('x-frame-options','').upper() in ['DENY','SAMEORIGIN']
    evidence.update(repository='TanStack/virtual',commit=commit,path=target,version='3.14.21',coreVersion='3.19.6',language='zh-CN' if chinese else 'en',treeTruncated=False,readmeCandidates=candidates,preferredReadmeCandidates=preferred,registry={'react':react,'core':core},manifests={'react':react_manifest,'core':core_manifest},snapshot={'path':'official/readme.md','bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()},homepage={'requestIndex':len(requests)-1,'status':'blocked' if restricted else 'unknown','frameAncestors':ancestors,'xFrameOptions':headers.get('x-frame-options'),'contentSecurityPolicy':headers.get('content-security-policy'),'browserFromLabOrigin':'NOT_RUN','reason':'Actual final framing policy excludes loopback HTTP Library Lab.' if restricted else 'Actual response headers alone do not prove usable Lab-origin embedding.'})
except Exception as error:
    evidence['syncedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    evidence['failure'] = {'url':attempted_url,'type':type(error).__name__,'message':str(error)}
    (OFFICIAL/'source-evidence.failed.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n')
    raise
else:
    evidence['syncedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with tempfile.TemporaryDirectory(prefix='.source-capture-',dir=OFFICIAL) as staging:
        staged_readme = Path(staging)/'readme.md'
        staged_evidence = Path(staging)/'source-evidence.json'
        staged_readme.write_bytes(data)
        staged_evidence.write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n')
        staged_readme.replace(OFFICIAL/'readme.md')
        staged_evidence.replace(OFFICIAL/'source-evidence.json')
print('C10',evidence['path'],evidence['snapshot'],'HTTP requests',len(requests),'homepage',evidence['homepage']['status'])
