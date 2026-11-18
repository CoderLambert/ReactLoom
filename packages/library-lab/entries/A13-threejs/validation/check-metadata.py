from pathlib import Path
import json,hashlib
b=Path('entries/A13-threejs');d=json.loads((b/'library.json').read_text());e=json.loads((b/'official/source-evidence.json').read_text())
assert d['packages'][0]['version']==e['version']==e['npmRelease']['version']=='0.186.0'
assert e['commit']==e['npmRelease']['gitHead']==d['official']['readme']['commit']=='148ef33ecb6d2502ff796d4554abd1549c95d519'
assert hashlib.sha256((b/'official/readme.md').read_bytes()).hexdigest()==d['official']['readme']['sha256']
assert [x for x in e['rootEntries'] if 'readme' in x.lower()]==['README.md']
assert [x['level'] for x in d['demos']]==['basic','advanced']
for x in d['demos']:
 assert len(x['sourceFiles'])==5
 for p in x['sourceFiles']:assert (b/p).is_file()
for k in ['sdk','build','browser']:assert json.loads((b/'verification.json').read_text())[k]['status']=='NOT_RUN'
print('2 distinct demos/5 runtime files/exact npm gitHead original SHA/version/formal NOT_RUN: PASS')
