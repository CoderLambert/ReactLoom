"""Read-only retrieval recipe. Prints raw source evidence; never overwrites the accepted snapshot.

Initial retrieval ran as python3 stdin during candidate09 freeze; raw stdout is source-fetch.txt.
Review a later stdout/diff before explicitly syncing official files and library metadata.
"""
import urllib.request
import json
import hashlib
import base64
import datetime

ref = '13e2b790546426a1a2e0e9b409f3f8dc6d6611f2'
records = []


def get(url, body=True):
    record = {'url': url}
    records.append(record)
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={
            'User-Agent': 'ReactLoomQualityReadOnly',
        }), timeout=25) as response:
            record.update(finalUrl=response.url, status=response.status, headers=dict(response.headers.items()))
            data = response.read() if body else None
            if data is not None:
                record.update(bytes=len(data), sha256=hashlib.sha256(data).hexdigest())
            else:
                record['body'] = 'NOT_READ: complete GET headers only'
            return data
    except Exception as error:
        record['error'] = repr(error)
        return None


root = get('https://api.github.com/repos/greensock/GSAP/contents/?ref=' + ref)
candidates = [item['name'] for item in json.loads(root) if 'readme' in item['name'].lower()] if root else []
raw = get('https://raw.githubusercontent.com/greensock/GSAP/' + ref + '/README.md')
package = get('https://raw.githubusercontent.com/greensock/GSAP/' + ref + '/package.json')
get('https://gsap.com/', False)
print(json.dumps({
    'repository': 'greensock/GSAP', 'commit': ref, 'tag': '3.15.0',
    'readmeCandidates': candidates, 'readmeBase64': base64.b64encode(raw).decode() if raw else None,
    'packageVersion': json.loads(package)['version'] if package else None, 'requests': records,
    'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'browserFromLabOrigin': 'NOT_RUN',
}, ensure_ascii=False))
