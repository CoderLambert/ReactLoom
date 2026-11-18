import pathlib,json,urllib.request,hashlib,datetime
out=pathlib.Path(__file__).resolve().parents[1]/'official';out.mkdir(exist_ok=True);requests=[]
def get(url,body=True):
 req=urllib.request.Request(url,headers={'User-Agent':'ReactLoom-quality','Accept':'application/vnd.github+json' if 'api.github.com' in url else '*/*'})
 with urllib.request.urlopen(req,timeout=35) as r:
  b=r.read() if body else None;requests.append({'url':url,'finalUrl':r.url,'status':r.status,'headers':dict(r.headers),'bytes':len(b) if b is not None else None,'sha256':hashlib.sha256(b).hexdigest() if b is not None else None,'bodyRead':body});return b
npm=json.loads(get('https://registry.npmjs.org/ajv/8.20.0'));commit=npm.get('gitHead');assert commit, 'npm gitHead absent: resolve actual tag first';repo='ajv-validator/ajv';manifest=json.loads(get(f'https://raw.githubusercontent.com/{repo}/{commit}/package.json'));assert manifest['version']=='8.20.0'
tree=json.loads(get(f'https://api.github.com/repos/{repo}/git/trees/{commit}?recursive=1'));assert not tree.get('truncated');candidates=[x['path'] for x in tree['tree'] if x['path'].split('/')[-1].lower().startswith('readme')];print(candidates,flush=True)
path=next((x for x in ['README.zh-CN.md','README.zh.md','README_ZH.md'] if x in candidates),'README.md');raw=get(f'https://raw.githubusercontent.com/{repo}/{commit}/{path}');(out/'readme.md').write_bytes(raw)
try:get('https://ajv.js.org/',False)
except Exception as e:requests.append({'url':'https://ajv.js.org/','error':str(e)})
a={'repository':repo,'commit':commit,'path':path,'version':'8.20.0','language':'en' if path=='README.md' else 'zh-CN','syncedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'readmeCandidates':candidates,'treeTruncated':False,'npm':npm,'manifest':manifest,'requests':requests};(out/'source-audit.json').write_text(json.dumps(a,ensure_ascii=False,indent=2)+'\n');print('official',len(raw),hashlib.sha256(raw).hexdigest(),flush=True)
