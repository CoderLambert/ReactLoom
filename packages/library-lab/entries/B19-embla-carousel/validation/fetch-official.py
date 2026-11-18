import urllib.request,json,pathlib,datetime,hashlib
entry=pathlib.Path(__file__).resolve().parents[1]
records=[]
def get(url):
    req=urllib.request.Request(url,headers={'User-Agent':'ReactLoom-quality','Accept':'application/vnd.github+json' if 'api.github.com' in url else '*/*'})
    with urllib.request.urlopen(req,timeout=40) as response:
        data=response.read();records.append({'url':url,'finalUrl':response.url,'status':response.status,'headers':dict(response.headers),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()});return data
npm=json.loads(get('https://registry.npmjs.org/embla-carousel-react/8.6.0'))
commit=npm.get('gitHead');print('version',npm['version'],'gitHead',commit,flush=True)
assert commit,'Need immutable release source'
repo='davidjerleke/embla-carousel'
tree=json.loads(get(f'https://api.github.com/repos/{repo}/git/trees/{commit}?recursive=1'));assert not tree.get('truncated')
paths=[item['path'] for item in tree['tree'] if item['path'].split('/')[-1].lower().startswith('readme')]
print('README candidates',paths,flush=True)
manifest=json.loads(get(f'https://raw.githubusercontent.com/{repo}/{commit}/packages/embla-carousel-react/package.json'));assert manifest['version']=='8.6.0'
path='packages/embla-carousel-react/README.md' if 'packages/embla-carousel-react/README.md' in paths else 'README.md'
raw=get(f'https://raw.githubusercontent.com/{repo}/{commit}/{path}');(entry/'official/readme.md').write_bytes(raw)
home=npm['homepage']
try:get(home)
except Exception as error:records.append({'url':home,'error':str(error)})
audit={'repository':repo,'commit':commit,'path':path,'version':'8.6.0','language':'en','syncedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'readmeCandidates':paths,'treeTruncated':False,'npm':npm,'package':manifest,'requests':records}
(entry/'official/source-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n');print('snapshot',len(raw),hashlib.sha256(raw).hexdigest(),flush=True)
