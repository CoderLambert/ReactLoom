import urllib.request,json,hashlib,datetime,pathlib
entry=pathlib.Path(__file__).resolve().parents[1]
commit='e34f2cf2dc609ebae482615f64be4dee4218a4eb'
repo='LottieFiles/dotlottie-web'
records=[]
def get(url):
 req=urllib.request.Request(url,headers={'User-Agent':'ReactLoom-quality','Accept':'application/vnd.github+json' if 'api.github.com' in url else '*/*'})
 with urllib.request.urlopen(req,timeout=45) as response:
  body=response.read();records.append({'url':url,'finalUrl':response.url,'status':response.status,'headers':dict(response.headers),'bytes':len(body),'sha256':hashlib.sha256(body).hexdigest()});return body
root=json.loads(get(f'https://api.github.com/repos/{repo}/contents?ref={commit}'))
package=json.loads(get(f'https://api.github.com/repos/{repo}/contents/packages/react?ref={commit}'))
manifest=json.loads(get(f'https://raw.githubusercontent.com/{repo}/{commit}/packages/react/package.json'))
readmes={'root':[i['name'] for i in root if i['name'].lower().startswith('readme')],'packages/react':[i['name'] for i in package if i['name'].lower().startswith('readme')]}
print('README candidates',readmes,'version',manifest['version'],flush=True)
assert manifest['version']=='0.20.0'
body=get(f'https://raw.githubusercontent.com/{repo}/{commit}/packages/react/README.md')
(entry/'official/readme.md').write_bytes(body)
home='https://developers.lottiefiles.com/docs/dotlottie-player/dotlottie-react/'
# The package manifest declares the authoritative homepage; follow its exact URL.
home=manifest.get('homepage',home)
try: get(home)
except Exception as error: records.append({'url':home,'error':str(error)})
result={'repository':repo,'tag':'@lottiefiles/dotlottie-react@0.20.0','commit':commit,'package':manifest,'readmeCandidates':readmes,'selectedPath':'packages/react/README.md','language':'en','syncedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'homepage':home,'requests':records}
(entry/'official/source-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print('snapshot',len(body),hashlib.sha256(body).hexdigest(),'homepage',home,flush=True)
print(json.dumps(records[-1],ensure_ascii=False),flush=True)
