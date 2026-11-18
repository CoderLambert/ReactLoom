import hashlib, json, pathlib
entry = pathlib.Path(__file__).resolve().parents[1]
metadata = json.loads((entry / 'library.json').read_text())
readme = metadata['official']['readme']
source = (entry / readme['snapshotPath']).read_bytes()
assert hashlib.sha256(source).hexdigest() == readme['sha256']
assert readme['version'] == '0.20.0'
assert readme['commit'] == 'e34f2cf2dc609ebae482615f64be4dee4218a4eb'
assert len(metadata['demos']) == 3
for demo in metadata['demos']:
    for path in demo['sourceFiles']:
        assert (entry / path).is_file(), path
print(json.dumps({'bytes': len(source), 'sha256': readme['sha256'], 'demos': 3, 'sourceFiles': 4}))
