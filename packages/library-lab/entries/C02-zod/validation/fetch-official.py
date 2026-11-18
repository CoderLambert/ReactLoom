import urllib.request,json,pathlib,datetime,hashlib
entry=pathlib.Path(__file__).resolve().parents[1];requests=[]
def get(url):
    req=urllib.request.Request(url,headers={'User-Agent':'ReactLoom-quality','Accept':'application/vnd.github+json' if 'api.github.com' in url else '*/*'})
    with urllib.request.urlopen(req,timeout=40) as response:
        data=response.read();requests.append({'url':url,'finalUrl':response.url,'status':response.status,'headers':dict(response.headers),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()});return data
npm=json.loads(get('https://registry.npmjs.org/zod/4.6.5'));commit=npm.get('gitHead') or '59bbc03e10c636b9eb3c393dfeb552819774ec21';print('fixed v4.6.5 tag',commit,flush=True)
repo='colinhacks/zod';tree=json.loads(get(f'https://api.github.com/repos/{repo}/git/trees/{commit}?recursive=1'));assert not tree.get('truncated')
candidates=[x['path'] for x in tree['tree'] if x['path'].split('/')[-1].lower().startswith('readme')];print('README candidates',candidates,flush=True)
manifest=json.loads(get(f'https://raw.githubusercontent.com/{repo}/{commit}/packages/zod/package.json'));assert manifest['version']=='4.6.5',manifest['version']
path='packages/zod/README.md' if 'packages/zod/README.md' in candidates else 'README.md';raw=get(f'https://raw.githubusercontent.com/{repo}/{commit}/{path}');(entry/'official/readme.md').write_bytes(raw)
try:get(npm['homepage'])
except Exception as error:requests.append({'url':npm['homepage'],'error':str(error)})
audit={'repository':repo,'commit':commit,'path':path,'version':'4.6.5','language':'en','syncedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'readmeCandidates':candidates,'treeTruncated':False,'commitBasis':'npm omitted gitHead; git ls-remote refs/tags/v4.6.5 resolved this immutable SHA','npm':npm,'package':manifest,'requests':requests};(entry/'official/source-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n');print('snapshot',len(raw),hashlib.sha256(raw).hexdigest(),flush=True)
