from pathlib import Path
import urllib.request,json,hashlib
from datetime import datetime,timezone
base=Path(__file__).resolve().parents[1];discovery=json.loads((base/'validation/source-discovery.json').read_text());records=discovery['records'];commit='1fb7869866dd619168d840291c9c54b4f129758b';repo='mermaid-js/mermaid'
def get(url,read=True):
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'ReactLoom-library-quality'}),timeout=40) as r:
  data=r.read() if read else b'';rec={'url':url,'finalUrl':r.url,'status':r.status,'headers':dict(r.headers),'checkedAt':datetime.now(timezone.utc).isoformat(),'bodyRead':read}
  if read:rec.update(bytes=len(data),sha256=hashlib.sha256(data).hexdigest())
  records.append(rec);return data,rec
raw,record=get(f'https://raw.githubusercontent.com/{repo}/{commit}/README.zh-CN.md');(base/'official/readme.md').write_bytes(raw)
# Official root README links to the canonical documentation home.
_,home=get('https://mermaid.ai/open-source/',False)
evidence={'ref':'mermaid@12.2.0','commit':commit,'repository':repo,'selection':'Matching release root README.zh-CN.md is upstream maintained; packages/mermaid has no separate README.','rootEntries':discovery['rootEntries'],'packageEntries':discovery['packageEntries'],'version':discovery['package']['version'],'records':records,'homepageStatus':'unknown','reason':'Final GET has no browser embedding proof; absent restriction headers do not establish allowed.'}
(base/'official/source-evidence.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n')
p=base/'library.json';d=json.loads(p.read_text());d['official']={'readme':{'repository':repo,'commit':commit,'path':'README.zh-CN.md','sourceUrl':f'https://github.com/{repo}/blob/{commit}/README.zh-CN.md','snapshotPath':'official/readme.md','language':'zh-CN','version':'12.2.0','sha256':record['sha256'],'syncedAt':record['checkedAt']},'homepage':{'url':'https://mermaid.ai/open-source/','kind':'website','status':'unknown','checkedAt':home['checkedAt'],'reason':'已实际GET官方文档入口，完整最终URL与响应头见official/source-evidence.json；未从Lab origin确认iframe内容，保持未知和直达，不依据load或超时推断成功。'}}
for demo in d['demos']:
 demo['sourceFiles']+=['examples/diagram-source.ts','examples/workshop.css']
d['demos'][0].update(title='从流程描述到可视分支',description='切换去重开关，观察同一可信业务模型生成的DSL与真实SVG同时变化。')
d['demos'][1].update(title='请求时序与缓存路径',description='比较API→Worker往返与缓存命中的真实sequenceDiagram，区分消息语义与业务执行。')
d['demos'][2].update(title='失败、恢复与渲染所有权',description='真实解析失败移除旧图，恢复后重新生成，观察串行队列与卸载边界。')
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'bytes':len(raw),'sha256':record['sha256'],'homepage':home},ensure_ascii=False))
