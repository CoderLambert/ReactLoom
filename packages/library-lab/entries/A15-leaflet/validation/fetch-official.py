from pathlib import Path
import datetime
import hashlib
import json
import urllib.request

entry = Path(__file__).resolve().parents[1]
official = entry / 'official'
official.mkdir(exist_ok=True)
ref = 'd15112c9e8ac339f0f74f563959d0423d291308d'
evidence = {
    'repository': 'Leaflet/Leaflet',
    'tag': 'v1.9.4',
    'tagObject': '91900f7b177e6a926dfc3a75c86dc11fd4f2cf34',
    'commit': ref,
    'browserFromLabOrigin': 'NOT_RUN',
    'requests': [],
}


def save():
    evidence['checkedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    (official / 'source-evidence.json').write_text(
        json.dumps(evidence, ensure_ascii=False, indent=2) + '\n'
    )


def get(url, body=True):
    record = {'url': url}
    evidence['requests'].append(record)
    try:
        with urllib.request.urlopen(
            urllib.request.Request(url, headers={'User-Agent': 'ReactLoomQuality'}),
            timeout=25,
        ) as response:
            record.update(finalUrl=response.url, status=response.status,
                          headers=dict(response.headers.items()))
            content = response.read() if body else None
            if content is not None:
                record.update(bytes=len(content), sha256=hashlib.sha256(content).hexdigest())
            else:
                record['body'] = 'NOT_READ: complete homepage GET response headers only'
            save()
            return content
    except Exception as error:
        record['error'] = repr(error)
        save()
        raise


tag = json.loads(get('https://api.github.com/repos/Leaflet/Leaflet/git/tags/' + evidence['tagObject']))
assert tag['object']['sha'] == ref
tree = json.loads(get('https://api.github.com/repos/Leaflet/Leaflet/git/trees/' + ref + '?recursive=1'))
assert tree['truncated'] is False
evidence['readmeCandidates'] = [item['path'] for item in tree['tree'] if 'readme' in item['path'].lower()]
assert evidence['readmeCandidates'] == ['README.md']
evidence['chosenReadme'] = 'README.md'
evidence['language'] = 'en'
evidence['selectionReason'] = 'Complete matching-release tree has only the upstream English README.md; no official Chinese candidate.'
readme = get('https://raw.githubusercontent.com/Leaflet/Leaflet/' + ref + '/README.md')
(official / 'readme.md').write_bytes(readme)
package = json.loads(get('https://raw.githubusercontent.com/Leaflet/Leaflet/' + ref + '/package.json'))
assert package['version'] == '1.9.4'
evidence['packageVersion'] = package['version']
evidence['packageLicense'] = package['license']
get('https://leafletjs.com/', False)
homepage = evidence['requests'][-1]
headers = {key.lower(): value for key, value in homepage['headers'].items()}
evidence['homepagePolicyHeaders'] = {key: headers.get(key) for key in ['x-frame-options', 'content-security-policy']}
save()
print(json.dumps({key: value for key, value in evidence.items() if key != 'requests'}, ensure_ascii=False, indent=2))
print('README', len(readme), hashlib.sha256(readme).hexdigest())
