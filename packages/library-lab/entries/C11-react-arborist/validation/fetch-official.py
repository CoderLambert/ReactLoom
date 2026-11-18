"""Capture matching official bytes only after every source check succeeds."""
import datetime
import hashlib
import json
from pathlib import Path
import re
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
    registry = json.loads(get('https://registry.npmjs.org/react-arborist/3.16.0'))
    commit = registry['gitHead']
    assert registry['version'] == '3.16.0' and commit == 'd74c4ec696ba98c1a4e981075f6d60cdff3e290b'
    tree = json.loads(get(f'https://api.github.com/repos/jameskerr/react-arborist/git/trees/{commit}?recursive=1'))
    assert tree['truncated'] is False
    candidates = [item['path'] for item in tree['tree'] if item['type']=='blob' and item['path'].split('/')[-1].lower().startswith('readme')]
    preferred = [path for path in candidates if '/' not in path or path.startswith('modules/react-arborist/README')]
    chinese = [path for path in preferred if re.search(r'zh|中文|README[._-]CN',path,re.I)]
    target = chinese[0] if chinese else ('modules/react-arborist/README.md' if 'modules/react-arborist/README.md' in preferred else 'README.md')
    raw = f'https://raw.githubusercontent.com/jameskerr/react-arborist/{commit}'
    manifest = json.loads(get(f'{raw}/modules/react-arborist/package.json'))
    assert manifest['name'] == 'react-arborist' and manifest['version'] == '3.16.0'
    data = get(f'{raw}/{target}')
    assert b'https://react-arborist.netlify.app' in data
    get('https://react-arborist.netlify.app', read_body=False)
    headers = {key.lower():value for key,value in requests[-1]['headers'].items()}
    match = re.search(r'(?:^|;)\s*frame-ancestors\s+([^;]+)',headers.get('content-security-policy',''))
    ancestors = match.group(1).strip() if match else None
    # Only explicit self/none or XFO without an overriding directive proves denial.
    blocked = bool(ancestors) and all(source in ["'self'", "'none'"] for source in ancestors.split())
    if ancestors is None:
        blocked = headers.get('x-frame-options','').upper() in ['DENY','SAMEORIGIN']
    evidence.update(repository='jameskerr/react-arborist',commit=commit,path=target,version='3.16.0',language='zh-CN' if chinese else 'en',registry=registry,manifest=manifest,treeTruncated=False,readmeCandidates=candidates,preferredReadmeCandidates=preferred,selectionReason='No README in the target package directory and no matching Chinese README; retain repository root original.',snapshot={'path':'official/readme.md','bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()},homepage={'requestIndex':len(requests)-1,'status':'blocked' if blocked else 'unknown','frameAncestors':ancestors,'xFrameOptions':headers.get('x-frame-options'),'contentSecurityPolicy':headers.get('content-security-policy'),'browserFromLabOrigin':'NOT_RUN','reason':'Explicit final response policy excludes a cross-origin Lab.' if blocked else 'Full final response headers do not establish successful embedding; actual Lab-origin browser is NOT_RUN.'})
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
print('C11',evidence['path'],evidence['snapshot'],'HTTP requests',len(requests),'homepage',evidence['homepage']['status'])
