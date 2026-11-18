"""Retry only the missing homepage observation, preserving completed source captures."""
import datetime,json,urllib.request
from pathlib import Path
ENTRY=Path(__file__).resolve().parents[1]
p=ENTRY/'official/source-evidence.json'; e=json.loads(p.read_text())
stamp=datetime.datetime.now(datetime.timezone.utc).isoformat()
try:
    with urllib.request.urlopen(urllib.request.Request('https://virtuoso.dev/',headers={'User-Agent':'ReactLoom-Library-Lab-source-audit'}),timeout=12) as response:
        record={'url':'https://virtuoso.dev/','finalUrl':response.url,'status':response.status,'checkedAt':stamp,'headers':dict(response.headers),'bodyStatus':'NOT_READ','bytes':None,'sha256':None}
        e['requests'].append(record)
        headers={key.lower():value for key,value in response.headers.items()}
        e['homepage']={'requestIndex':len(e['requests'])-1,'status':'unknown','xFrameOptions':headers.get('x-frame-options'),'contentSecurityPolicy':headers.get('content-security-policy'),'reason':'已获取完整HTTP头，未实际浏览器确认可嵌入。'}
except Exception as error:
    e['homepage']={'status':'unknown','checkedAt':stamp,'url':'https://virtuoso.dev/','httpStatus':None,'headers':None,'xFrameOptions':None,'contentSecurityPolicy':None,'error':str(error),'reason':'两次实际TLS连接未取得HTTP响应头，不能将null字段解释为官网没有限制；未实际浏览器确认。'}
    print('homepage unknown; HTTP headers unavailable:',repr(error))
p.write_text(json.dumps(e,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(e['homepage'],ensure_ascii=False,indent=2))
