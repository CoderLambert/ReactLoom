from pathlib import Path
import urllib.request,json,hashlib
from datetime import datetime,timezone
b=Path(__file__).resolve().parents[1];repo='mrdoob/three.js';c='148ef33ecb6d2502ff796d4554abd1549c95d519';records=[]
def get(url,body=True):
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'ReactLoom-library-quality','Accept':'application/vnd.github+json' if 'api.github' in url else '*/*'}),timeout=35) as r:
  data=r.read() if body else b'';rec={'url':url,'finalUrl':r.url,'status':r.status,'headers':dict(r.headers),'checkedAt':datetime.now(timezone.utc).isoformat(),'bodyRead':body}
  if body:rec.update(bytes=len(data),sha256=hashlib.sha256(data).hexdigest())
  records.append(rec);return data,rec
npm=json.loads(get('https://registry.npmjs.org/three/0.186.0')[0]);assert npm['version']=='0.186.0';assert npm['gitHead']==c
root=json.loads(get(f'https://api.github.com/repos/{repo}/contents?ref={c}')[0]);print('READMEs',[x['path'] for x in root if 'readme' in x['name'].lower()],flush=True)
pkg=json.loads(get(f'https://raw.githubusercontent.com/{repo}/{c}/package.json')[0]);assert pkg['version']=='0.186.0'
raw,rec=get(f'https://raw.githubusercontent.com/{repo}/{c}/README.md');(b/'official/readme.md').write_bytes(raw)
_,home=get('https://threejs.org/',False);headers={k.lower():v for k,v in home['headers'].items()};restriction=headers.get('x-frame-options') or ('frame-ancestors' if 'frame-ancestors' in headers.get('content-security-policy','') else None);status='blocked' if restriction else 'unknown'
(b/'official/source-evidence.json').write_text(json.dumps({'repository':repo,'tagObject':'48dd7be01263658aad497fd72e09d1e4c6213461','commit':c,'ref':'npm three@0.186.0 gitHead','version':pkg['version'],'npmRelease':{'version':npm['version'],'gitHead':npm['gitHead'],'registry':'https://registry.npmjs.org/three/0.186.0'},'rootEntries':[x['name'] for x in root],'records':records,'homepageStatus':status,'restriction':restriction,'discoveryCorrection':'Annotated tag object48dd7be raw404; r186 dereferenced9b4a2ac package declares0.186.1, not installed0.186.0. Official npm0.186.0 metadata reports gitHead148ef33, used for exact matching snapshot; no placeholder or manifest rewrite.'},ensure_ascii=False,indent=2)+'\n')
p=b/'library.json';d=json.loads(p.read_text());d['official']={'readme':{'repository':repo,'commit':c,'path':'README.md','sourceUrl':f'https://github.com/{repo}/blob/{c}/README.md','snapshotPath':'official/readme.md','language':'en','version':'0.186.0','sha256':rec['sha256'],'syncedAt':rec['checkedAt']},'homepage':{'url':'https://threejs.org/','kind':'website','status':status,'checkedAt':home['checkedAt'],'reason':'实际GET官方包声明主页，最终URL/完整头见official/source-evidence.json。'+(f'响应明确限制跨源嵌入：{restriction}，保留直达。' if restriction else '未发现明确嵌入限制头，但没有Lab origin实际内容确认，保持未知及直达，不从load或超时推定成功。')}};p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n');print('README',len(raw),rec['sha256'],'homepage',status,restriction,flush=True)
