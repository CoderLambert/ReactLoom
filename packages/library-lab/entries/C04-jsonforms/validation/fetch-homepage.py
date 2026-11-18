"""Resume only the framing-header GET; preserve previously captured version/original bytes."""
import datetime
import json
from pathlib import Path
import urllib.request

entry = Path(__file__).resolve().parents[1]
path = entry / 'official/source-evidence.json'
evidence = json.loads(path.read_text())
started = datetime.datetime.now(datetime.timezone.utc).isoformat()
with urllib.request.urlopen(urllib.request.Request('https://jsonforms.io/', headers={
    'User-Agent': 'ReactLoom-Library-Lab-source-audit',
}), timeout=30) as response:
    headers = dict(response.headers)
    record = {'url': 'https://jsonforms.io/', 'finalUrl': response.url, 'status': response.status,
              'checkedAt': started, 'headers': headers, 'bodyStatus': 'NOT_READ',
              'bytes': None, 'sha256': None}
evidence['requests'].append(record)
lower = {key.lower(): value for key, value in headers.items()}
evidence['homepage'] = {'requestIndex': len(evidence['requests']) - 1,
                        'xFrameOptions': lower.get('x-frame-options'),
                        'contentSecurityPolicy': lower.get('content-security-policy'), 'status': 'blocked' if "frame-ancestors 'self'" in lower.get('content-security-policy', '') else 'unknown', 'reason': '仅按实际最终完整响应头判断；frame-ancestors self限制跨源Lab，正文NOT_READ；没有实际iframe允许证明。'}
evidence['syncedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
path.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')
print('C04 homepage GET headers captured; body NOT_READ, original snapshots unchanged:', evidence['homepage'])
