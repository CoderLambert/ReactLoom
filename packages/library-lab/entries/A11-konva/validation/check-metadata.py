from pathlib import Path
import json,hashlib
b=Path('entries/A11-konva');lib=json.loads((b/'library.json').read_text());e=json.loads((b/'official/source-evidence.json').read_text())
assert lib['packages'][0]['version']==e['version']=='10.9.0'
assert hashlib.sha256((b/'official/readme.md').read_bytes()).hexdigest()==lib['official']['readme']['sha256']
assert e['commit']==lib['official']['readme']['commit'];assert lib['official']['readme']['language']=='en'
assert lib['official']['homepage']['status']==e['homepageStatus']=='blocked'
assert e['records'][-1]['headers']['X-Frame-Options'].upper()=='SAMEORIGIN'
assert [x for x in e['rootEntries'] if 'readme' in x.lower()]==['README.md']
assert len(lib['demos'])==3
for d in lib['demos']:
 assert len(d['sourceFiles'])==3
 for p in d['sourceFiles']:assert (b/p).is_file()
for k in ['sdk','build','browser']:assert json.loads((b/'verification.json').read_text())[k]['status']=='NOT_RUN'
print('3 demos, 3 necessary runtime files, fixed original/version/hash/official candidates, formal NOT_RUN: PASS')
