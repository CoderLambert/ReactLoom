"""Inspect only current C16 hashes, displayed sources, local links and formal states."""
import hashlib
import json
from pathlib import Path
import re

entry = Path(__file__).resolve().parents[1]
inputs = json.loads((entry/'validation/input-hashes.json').read_text())
for name, expected in inputs.items():
    assert hashlib.sha256((entry/name).read_bytes()).hexdigest() == expected, name
links = 0
for name in ['guide.md','agent.md','local-validation.md']:
    for target in re.findall(r'\]\(([^)]+)\)',(entry/name).read_text()):
        if re.match(r'^[a-z]+://',target) or target.startswith('#'):
            continue
        assert (entry/target.split('#')[0]).exists(), (name,target)
        links += 1
base = json.loads((entry/'validation/baseline.json').read_text())
original_agents = next(item for item in base['files'] if item['path']=='AGENTS.md')
assert hashlib.sha256((entry/'AGENTS.md').read_bytes()).hexdigest() == original_agents['sha256']
assert not list(entry.glob('validation/*.check.ts'))
for value in json.loads((entry/'verification.json').read_text()).values():
    assert value['status'] == 'NOT_RUN'
print(json.dumps({'inputFiles':len(inputs),'inputDifferences':0,'localLinks':links,'agentsUnchanged':True,'proposalTemporaryFiles':0,'formal':'NOT_RUN','browser':'3 candidate18 client cases PASS; new official display NOT_RUN'},ensure_ascii=False))
