"""Fixed package README and homepage capture; failures preserve the previous pair."""
import datetime, hashlib, json, re, tempfile, urllib.parse, urllib.request
from pathlib import Path
ENTRY = Path(__file__).resolve().parents[1]
OFFICIAL = ENTRY/'official'
OFFICIAL.mkdir(exist_ok=True)
e = {'repository':'dcastil/tailwind-merge','version':'3.7.0','requests':[]}
attempted_url = None

def get(url, body=True):
    global attempted_url
    attempted_url = url
    checked = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'ReactLoom-Library-Lab-source-audit'}),timeout=25) as response:
        headers = []
        for key,value in response.headers.raw_items():
            if key.lower() == 'set-cookie':
                parts=value.split(';',1)
                value='<REDACTED_PUBLIC_COOKIE_SHA256:'+hashlib.sha256(parts[0].encode()).hexdigest()+'>'+(';' + parts[1] if len(parts)>1 else '')
            headers.append([key,value])
        record={'url':url,'finalUrl':response.url,'status':response.status,'checkedAt':checked,'headers':dict(headers),'rawHeaders':headers,'bodyStatus':'NOT_READ','bytes':None,'sha256':None}
        e['requests'].append(record)
        data=response.read() if body else None
        if body: record.update(bodyStatus='READ',bytes=len(data),sha256=hashlib.sha256(data).hexdigest())
        return data

try:
    registry=json.loads(get('https://registry.npmjs.org/tailwind-merge/3.7.0'))
    assert registry['name']=='tailwind-merge' and registry['version']=='3.7.0'
    e['registry']={key:registry.get(key) for key in ['name','version','gitHead','license','repository','homepage']}
    tag_url='https://api.github.com/repos/dcastil/tailwind-merge/git/ref/tags/tailwind-merge%403.7.0'
    tag=json.loads(get(tag_url));e['tagChain']=[{'url':tag_url,'response':tag}]
    target=tag['object']
    while target['type']=='tag':
        url=target['url'];parsed=json.loads(get(url));e['tagChain'].append({'url':url,'response':parsed});target=parsed['object']
    assert target['type']=='commit';commit=target['sha'];assert len(commit)==40;e['commit']=commit
    raw='https://raw.githubusercontent.com/dcastil/tailwind-merge/'+commit
    tree=json.loads(get('https://api.github.com/repos/dcastil/tailwind-merge/git/trees/'+commit+'?recursive=1'))
    assert tree['truncated'] is False;e['treeTruncated']=False
    e['readmeCandidates']=[item['path'] for item in tree['tree'] if item['type']=='blob' and item['path'].split('/')[-1].lower().startswith('readme')]
    folder='packages/tailwind-merge';manifest_path=folder+'/package.json'
    manifest=json.loads(get(raw+'/'+manifest_path));assert manifest['name']=='tailwind-merge' and manifest['version']=='3.7.0'
    e['manifest']={key:manifest.get(key) for key in ['name','version','license','repository']};e['manifestPath']=manifest_path
    direct=[path for path in e['readmeCandidates'] if path.startswith(folder+'/') and '/' not in path[len(folder)+1:]]
    e['preferredReadmeCandidates']=direct
    chinese=[path for path in direct if re.search(r'zh|中文|README[._-]CN',path,re.I)]
    path=chinese[0] if chinese else folder+'/README.md';assert path in direct;e['path']=path
    data=get(raw+'/'+path);e['readme']={'language':'zh-CN' if chinese else 'en','bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
    homepage='https://github.com/dcastil/tailwind-merge';get(homepage,body=False)
    headers={key.lower():value for key,value in e['requests'][-1]['rawHeaders']}
    csp=headers.get('content-security-policy');xfo=headers.get('x-frame-options')
    match=re.search(r'(?:^|;)\s*frame-ancestors\s+([^;]+)',csp or '');ancestors=match.group(1).strip() if match else None
    blocked=bool(ancestors) and all(token in ["'self'","'none'"] for token in ancestors.split())
    if ancestors is None:blocked=(xfo or '').upper() in ['DENY','SAMEORIGIN']
    e['homepage']={'url':homepage,'kind':'repository','requestIndex':len(e['requests'])-1,'status':'blocked' if blocked else 'unknown','xFrameOptions':xfo,'contentSecurityPolicy':csp,'frameAncestors':ancestors,'browserFromLabOrigin':'NOT_RUN','reason':'Official package homepage is the repository; actual final header policy excludes the cross-origin Lab.' if blocked else 'No Lab-origin browser confirmation; headers alone do not prove embedding.'}
except Exception as error:
    e['syncedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat();e['failure']={'url':attempted_url,'type':type(error).__name__,'message':str(error)}
    (OFFICIAL/'source-evidence.failed.json').write_text(json.dumps(e,ensure_ascii=False,indent=2)+'\n')
    raise
else:
    e['syncedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat()
    with tempfile.TemporaryDirectory(prefix='.capture-',dir=OFFICIAL) as temporary:
        a=Path(temporary)/'readme.md';b=Path(temporary)/'source-evidence.json'
        a.write_bytes(data);b.write_text(json.dumps(e,ensure_ascii=False,indent=2)+'\n')
        a.replace(OFFICIAL/'readme.md');b.replace(OFFICIAL/'source-evidence.json')
    print(json.dumps({key:e[key] for key in ['commit','manifestPath','preferredReadmeCandidates','path','readme','homepage']},ensure_ascii=False,indent=2))
