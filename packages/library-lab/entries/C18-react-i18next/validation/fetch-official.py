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
        raw_headers = []
        for key, value in response.headers.raw_items():
            if key.lower() == 'set-cookie':
                pieces = value.split(';', 1)
                value = '<REDACTED_PUBLIC_COOKIE_SHA256:' + hashlib.sha256(pieces[0].encode()).hexdigest() + '>' + (';' + pieces[1] if len(pieces) > 1 else '')
            raw_headers.append([key, value])
        data = response.read() if read_body else None
        requests.append({'url':url,'finalUrl':response.url,'status':response.status,'checkedAt':checked,'headers':dict(raw_headers),'rawHeaders':raw_headers,'bytes':len(data) if data is not None else None,'sha256':hashlib.sha256(data).hexdigest() if data is not None else None,'bodyStatus':'READ' if read_body else 'NOT_READ'})
    return data

try:
    registry = json.loads(get('https://registry.npmjs.org/react-i18next/17.0.16'))
    core = json.loads(get('https://registry.npmjs.org/i18next/26.4.3'))
    assert core['name'] == 'i18next' and core['version'] == '26.4.3'
    commit = registry['gitHead']
    assert registry['version'] == '17.0.16' and commit == '606b6a55f231bbf73823863fbb94e6b8eb8272fd'
    tree = json.loads(get(f'https://api.github.com/repos/i18next/react-i18next/git/trees/{commit}?recursive=1'))
    assert tree['truncated'] is False
    candidates = [item['path'] for item in tree['tree'] if item['type']=='blob' and item['path'].split('/')[-1].lower().startswith('readme')]
    preferred = [path for path in candidates if '/' not in path]
    chinese = [path for path in preferred if re.search(r'zh|中文|README[._-]CN',path,re.I)]
    target = chinese[0] if chinese else 'README.md'
    raw = f'https://raw.githubusercontent.com/i18next/react-i18next/{commit}'
    manifest = json.loads(get(f'{raw}/package.json'))
    assert manifest['name'] == 'react-i18next' and manifest['version'] == '17.0.16'
    data = get(f'{raw}/{target}')
    assert b'https://react.i18next.com/' in data
    get('https://react.i18next.com/', read_body=False)
    headers = {key.lower():value for key,value in requests[-1]['headers'].items()}
    match = re.search(r'(?:^|;)\s*frame-ancestors\s+([^;]+)',headers.get('content-security-policy',''))
    ancestors = match.group(1).strip() if match else None
    # Only explicit self/none or XFO without an overriding directive proves denial.
    blocked = bool(ancestors) and all(source in ["'self'", "'none'"] for source in ancestors.split())
    if ancestors is None:
        blocked = headers.get('x-frame-options','').upper() in ['DENY','SAMEORIGIN']
    # The actual Lab origin is HTTP; these sources cannot match that ancestor.
    if ancestors and all(source in ["https:", "ionic:", "capacitor:", "'self'", "'none'"] for source in ancestors.split()):
        blocked = True

    evidence.update(repository='i18next/react-i18next',commit=commit,path=target,version='17.0.16',language='zh-CN' if chinese else 'en',registry=registry,coreRegistry=core,manifest=manifest,treeTruncated=False,readmeCandidates=candidates,preferredReadmeCandidates=preferred,selectionReason='Target npm package is the repository root; no matching official Chinese README was found, retain root original.',snapshot={'path':'official/readme.md','bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()},homepage={'requestIndex':len(requests)-1,'status':'blocked' if blocked else 'unknown','frameAncestors':ancestors,'xFrameOptions':headers.get('x-frame-options'),'contentSecurityPolicy':headers.get('content-security-policy'),'browserFromLabOrigin':'NOT_RUN','reason':'Explicit final response policy excludes a cross-origin Lab.' if blocked else 'Captured final header list alone does not establish successful embedding; actual Lab-origin browser is NOT_RUN.'})
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
print('C18',evidence['path'],evidence['snapshot'],'HTTP requests',len(requests),'homepage',evidence['homepage']['status'])
