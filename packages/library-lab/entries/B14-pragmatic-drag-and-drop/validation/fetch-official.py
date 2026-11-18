import urllib.request, json, pathlib, datetime, hashlib
entry=pathlib.Path(__file__).resolve().parents[1]
records=[]
def get(url):
    req=urllib.request.Request(url,headers={'User-Agent':'ReactLoom-quality','Accept':'application/vnd.github+json' if 'api.github.com' in url else '*/*'})
    with urllib.request.urlopen(req,timeout=40) as response:
        data=response.read();records.append({'url':url,'finalUrl':response.url,'status':response.status,'headers':dict(response.headers),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()});return data
metadata=json.loads(get('https://registry.npmjs.org/@atlaskit%2fpragmatic-drag-and-drop/1.8.1'))
commit=metadata.get('gitHead');print('npm gitHead',commit,'repository',metadata.get('repository'),flush=True)
if not commit:
    commit=json.loads((entry/'validation/matched-source.json').read_text())['commit']
    print('Using fixed matching-version public mirror commit',commit,flush=True)
repo='atlassian/pragmatic-drag-and-drop'
tree=json.loads(get(f'https://api.github.com/repos/{repo}/git/trees/{commit}?recursive=1'))
readmes=[i['path'] for i in tree['tree'] if i['path'].split('/')[-1].lower().startswith('readme')]
print('candidates',readmes,flush=True)
manifest=json.loads(get(f'https://raw.githubusercontent.com/{repo}/{commit}/packages/core/package.json'));assert manifest['version']=='1.8.1',manifest['version']
path='packages/core/README.md' if 'packages/core/README.md' in readmes else 'README.md'
data=get(f'https://raw.githubusercontent.com/{repo}/{commit}/{path}');(entry/'official/readme.md').write_bytes(data)
home=metadata['homepage']
try:get(home)
except Exception as error:records.append({'url':home,'error':str(error)})
result={'repository':repo,'commit':commit,'path':path,'language':'en','version':'1.8.1','syncedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'readmeCandidates':readmes,'treeTruncated':tree.get('truncated'),'npm':metadata,'package':manifest,'requests':records}
(entry/'official/source-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print('saved',len(data),hashlib.sha256(data).hexdigest(),flush=True)
