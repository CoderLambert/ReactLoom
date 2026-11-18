"""Capture actual matching react-virtuoso sources and complete homepage headers."""
import datetime,hashlib,json,urllib.request,urllib.parse
from pathlib import Path
ENTRY=Path(__file__).resolve().parents[1]
OFFICIAL=ENTRY/'official'; OFFICIAL.mkdir(exist_ok=True)
evidence={'repository':'petyosi/react-virtuoso','version':'4.18.19','requests':[]}
def get(url,body=True):
    stamp=datetime.datetime.now(datetime.timezone.utc).isoformat()
    with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'ReactLoom-Library-Lab-source-audit'}),timeout=25) as response:
        record={'url':url,'finalUrl':response.url,'status':response.status,'checkedAt':stamp,'headers':dict(response.headers),'bodyStatus':'NOT_READ','bytes':None,'sha256':None}
        evidence['requests'].append(record)
        data=response.read() if body else None
        if body: record.update(bodyStatus='READ',bytes=len(data),sha256=hashlib.sha256(data).hexdigest())
        return data
try:
    package=json.loads(get('https://registry.npmjs.org/react-virtuoso/4.18.19'))
    assert package['version']=='4.18.19'
    evidence['package']={key:package.get(key) for key in ['name','version','gitHead','license','repository','homepage','peerDependencies']}
    commit=package.get('gitHead')
    if not commit:
        tag=json.loads(get('https://api.github.com/repos/petyosi/react-virtuoso/git/ref/tags/'+urllib.parse.quote('react-virtuoso@4.18.19',safe='')))
        evidence['tag']='react-virtuoso@4.18.19'
        target=tag['object']
        while target['type']=='tag':
            target=json.loads(get(target['url']))['object']
        assert target['type']=='commit'
        commit=target['sha']
    evidence['commit']=commit
    assert len(commit)==40 and all(c in '0123456789abcdef' for c in commit)
    raw='https://raw.githubusercontent.com/petyosi/react-virtuoso/'+commit
    manifest=json.loads(get(raw+'/packages/react-virtuoso/package.json'))
    assert manifest['name']=='react-virtuoso' and manifest['version']=='4.18.19'
    evidence['manifest']={key:manifest.get(key) for key in ['name','version','license','peerDependencies']}
    tree=json.loads(get('https://api.github.com/repos/petyosi/react-virtuoso/git/trees/'+commit+'?recursive=1'))
    assert tree['truncated'] is False
    candidates=[item['path'] for item in tree['tree'] if 'readme' in item['path'].lower() and item['type']=='blob']
    evidence['treeTruncated']=False; evidence['readmeCandidates']=candidates
    preferred=[path for path in candidates if path.startswith('packages/react-virtuoso/README') or '/' not in path]
    chinese=[path for path in preferred if 'zh' in path.lower() or '中文' in path]
    path=chinese[0] if chinese else ('packages/react-virtuoso/README.md' if 'packages/react-virtuoso/README.md' in candidates else 'README.md')
    data=get(raw+'/'+path); (OFFICIAL/'readme.md').write_bytes(data)
    evidence['readme']={'path':path,'language':'zh-CN' if chinese else 'en','bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
    sources={}
    for source in ['packages/react-virtuoso/src/hooks/useSize.ts','packages/react-virtuoso/src/hooks/useScrollTop.ts','packages/react-virtuoso/src/followOutputSystem.ts','packages/react-virtuoso/src/listStateSystem.ts']:
        if source in [item['path'] for item in tree['tree']]:
            content=get(raw+'/'+source)
            sources[source]={'sha256':hashlib.sha256(content).hexdigest(),'text':content.decode()}
    (ENTRY/'validation/upstream-source-audit.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2)+'\n')
    get('https://virtuoso.dev/',body=False)
    headers={key.lower():value for key,value in evidence['requests'][-1]['headers'].items()}
    csp=headers.get('content-security-policy'); xfo=headers.get('x-frame-options')
    blocked=bool((csp and ('frame-ancestors \'self\'' in csp or 'frame-ancestors \'none\'' in csp)) or (not (csp and 'frame-ancestors' in csp) and xfo and xfo.upper() in ['DENY','SAMEORIGIN']))
    evidence['homepage']={'requestIndex':len(evidence['requests'])-1,'xFrameOptions':xfo,'contentSecurityPolicy':csp,'status':'blocked' if blocked else 'unknown','reason':'按实际最终完整HTTP头判断；未实际浏览器确认，未读官网正文。'}
finally:
    evidence['syncedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat()
    (OFFICIAL/'source-evidence.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({key:evidence.get(key) for key in ['commit','readme','homepage','readmeCandidates']},ensure_ascii=False,indent=2))
