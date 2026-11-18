"""Anonymous immutable Frappe Gantt 1.2.2 source/header capture, this entry only."""
import datetime,hashlib,json,tempfile,urllib.request,urllib.parse
from pathlib import Path
ENTRY=Path(__file__).resolve().parents[1]; OFFICIAL=ENTRY/'official';OFFICIAL.mkdir(exist_ok=True)
e={'repository':'frappe/gantt','version':'1.2.2','requests':[]}
attempted_url = None
def get(url,body=True):
    global attempted_url
    attempted_url = url
    stamp=datetime.datetime.now(datetime.timezone.utc).isoformat()
    with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'ReactLoom-Library-Lab-source-audit'}),timeout=20) as response:
        headers=[]
        for key,value in response.headers.items():
            if key.lower()=='set-cookie':
                pieces=value.split(';',1)
                value='<REDACTED_PUBLIC_COOKIE_SHA256:'+hashlib.sha256(pieces[0].encode()).hexdigest()+'>'+(';' + pieces[1] if len(pieces)>1 else '')
            headers.append([key,value])
        record={'url':url,'finalUrl':response.url,'status':response.status,'checkedAt':stamp,'headers':dict(headers),'rawHeaders':headers,'bodyStatus':'NOT_READ','bytes':None,'sha256':None}
        e['requests'].append(record)
        data=response.read() if body else None
        if body:record.update(bodyStatus='READ',bytes=len(data),sha256=hashlib.sha256(data).hexdigest())
        return data
try:
    package=json.loads(get('https://registry.npmjs.org/frappe-gantt/1.2.2'))
    assert package['version']=='1.2.2'
    e['package']={key:package.get(key) for key in ['name','version','gitHead','license','repository','homepage']}
    commit=package.get('gitHead')
    if not commit:
        tag=json.loads(get('https://api.github.com/repos/frappe/gantt/git/ref/tags/v1.2.2'));e['tag']='v1.2.2';target=tag['object']
        while target['type']=='tag':target=json.loads(get(target['url']))['object']
        assert target['type']=='commit';commit=target['sha']
    assert len(commit)==40
    e['commit']=commit
    raw='https://raw.githubusercontent.com/frappe/gantt/'+commit
    manifest=json.loads(get(raw+'/package.json'))
    assert manifest['name']=='frappe-gantt' and manifest['version']=='1.2.2'
    e['manifest']={key:manifest.get(key) for key in ['name','version','license','exports']}
    tree=json.loads(get('https://api.github.com/repos/frappe/gantt/git/trees/'+commit+'?recursive=1'))
    assert tree['truncated'] is False;e['treeTruncated']=False
    e['readmeCandidates']=[item['path'] for item in tree['tree'] if 'readme' in item['path'].lower() and item['type']=='blob']
    chinese=[path for path in e['readmeCandidates'] if '/' not in path and ('zh' in path.lower() or '中文' in path)]
    path=chinese[0] if chinese else 'README.md'
    data=get(raw+'/'+path)
    e['readme']={'path':path,'language':'zh-CN' if chinese else 'en','bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
    get('https://frappe.io/gantt',body=False)
    headers={key.lower():value for key,value in e['requests'][-1]['headers'].items()};csp=headers.get('content-security-policy');xfo=headers.get('x-frame-options')
    blocked=bool((csp and ("frame-ancestors 'self'" in csp or "frame-ancestors 'none'" in csp)) or (not (csp and 'frame-ancestors' in csp) and xfo and xfo.upper() in ['DENY','SAMEORIGIN']))
    e['homepage']={'requestIndex':len(e['requests'])-1,'status':'blocked' if blocked else 'unknown','xFrameOptions':xfo,'contentSecurityPolicy':csp,'reason':'只按实际最终完整响应头核对，未从Lab origin实际浏览器确认可嵌入；官网正文NOT_READ。'}
except Exception as error:
    e['syncedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    e['failure'] = {'url': attempted_url, 'type': type(error).__name__, 'message': str(error)}
    # A failed transfer never replaces the previous complete successful pair.
    (OFFICIAL / 'source-evidence.failed.json').write_text(json.dumps(e, ensure_ascii=False, indent=2) + '\n')
    raise
else:
    e['syncedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    # Acquire every required response, then stage both artifacts before either replacement.
    with tempfile.TemporaryDirectory(prefix='.source-capture-', dir=OFFICIAL) as staging:
        staged_readme = Path(staging) / 'readme.md'
        staged_evidence = Path(staging) / 'source-evidence.json'
        staged_readme.write_bytes(data)
        staged_evidence.write_text(json.dumps(e, ensure_ascii=False, indent=2) + '\n')
        staged_readme.replace(OFFICIAL / 'readme.md')
        staged_evidence.replace(OFFICIAL / 'source-evidence.json')
print(json.dumps({key:e.get(key) for key in ['commit','readme','readmeCandidates','homepage']},ensure_ascii=False,indent=2))
