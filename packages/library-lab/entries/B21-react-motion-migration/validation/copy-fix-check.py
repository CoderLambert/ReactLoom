from pathlib import Path
import datetime
import hashlib
import json
import re
import subprocess

entry = Path(__file__).resolve().parent.parent
lab = entry.parent.parent
root = lab.parent.parent
prefix = entry.relative_to(root).as_posix() + '/'
baseline = json.loads((entry / 'validation/copy-fix-baseline.json').read_text())
digest = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
documents = ['guide.md', 'agent.md', 'local-validation.md']
expected_changes = {prefix + name for name in documents}
changed = [path for path, old in baseline['files'].items() if digest(root / path) != old]
assert set(changed) == expected_changes, changed

candidate_dir = root / 'docs/library-lab/evidence/quality-upgrade/candidate-15'
candidate = json.loads((candidate_dir / 'inputs.json').read_text())
protected = {
    path: value
    for path, value in candidate['files'].items()
    if path.startswith(prefix)
    and path[len(prefix):].split('/')[0] in {'examples', 'tests', 'official'}
}
assert len(protected) == 13, len(protected)
assert all(digest(root / path) == value for path, value in protected.items())
suite = 'packages/library-lab/e2e/quality-remediation-motion-migration.spec.ts'
assert digest(root / suite) == candidate['files'][suite]

metadata = json.loads((entry / 'library.json').read_text())
formal = json.loads((entry / 'verification.json').read_text())
assert {kind: formal[kind]['status'] for kind in ['sdk', 'build', 'browser']} == {
    'sdk': 'NOT_RUN', 'build': 'NOT_RUN', 'browser': 'NOT_RUN'
}
assert digest(entry / 'verification.json') == baseline['files'][prefix + 'verification.json']
readme = metadata['official']['readme']
assert readme['path'] == 'packages/motion/README.md'
assert (entry / readme['snapshotPath']).stat().st_size == 8259
assert digest(entry / readme['snapshotPath']) == readme['sha256'] == '3d53967ddaef8a5c37b6623ee07376aac9f9f1d2c52c894af3e521ba864fca3f'
archived = entry / 'official/repository-root-readme.md'
assert archived.stat().st_size == 7475
assert digest(archived) == '08915bb5254a4bc1fd47e8d7ea8fff0dcb470461f6fd6b59fb6d2f0bef0400df'
correction = json.loads((entry / 'official/package-readme-correction.json').read_text())
assert correction['bytes'] == 8259 and correction['sha256'] == readme['sha256']
assert metadata['official']['homepage']['status'] == 'unknown'

browser_record = json.loads((candidate_dir / 'browser.json').read_text())
browser_log = (candidate_dir / 'browser.txt').read_text()
passed = [line.strip() for line in browser_log.splitlines() if '✓' in line and '@B21' in line]
assert len(passed) == 4 and browser_record['exitCode'] == 1
assert '26 passed' in browser_log and '3 failed' in browser_log
assert len([line for line in browser_log.splitlines() if '✘' in line and '@B22' in line]) == 3

texts = {name: (entry / name).read_text() for name in documents}
assert '本地Chromium已覆盖三个目标' in texts['guide.md']
assert '交root统一执行；真实退出/打断' not in texts['guide.md']
assert '本地Chromium已完成三个目标及官方展示共4项' in texts['agent.md']
assert '当前作者复核' in texts['local-validation.md']
assert '作者初交浏览器提案（历史检查点）' in texts['local-validation.md']
assert '当前主[现代README]' in texts['local-validation.md']
assert '仓库根README历史快照' in texts['local-validation.md']
links = {}
for name, text in texts.items():
    assert not any(line.rstrip() != line for line in text.splitlines()), name
    assert text.count('```') % 2 == 0, name
    local = []
    for href in re.findall(r'\[[^\]]+\]\(([^)]+)\)', text):
        if re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*:', href) or href.startswith('#'):
            continue
        target = href.split('#', 1)[0]
        assert (entry / target).resolve().is_file(), (name, href)
        local.append(href)
    links[name] = local

diff_command = ['git', 'diff', '--check', '--', 'entries/B21-react-motion-migration']
diff_run = subprocess.run(diff_command, cwd=lab, text=True, capture_output=True)
(entry / 'validation/copy-fix-diff.txt').write_text(
    'cwd=' + str(lab) + '\ncommand=' + ' '.join(diff_command) + '\n'
    + diff_run.stdout + diff_run.stderr + '\nexitCode=' + str(diff_run.returncode) + '\n'
)
assert diff_run.returncode == 0, diff_run.stdout + diff_run.stderr

evidence = {
    'capturedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'cwd': str(lab),
    'command': ['python', 'entries/B21-react-motion-migration/validation/copy-fix-check.py'],
    'exitCode': 0,
    'scope': 'B21 documentation-only P2 repair; pending independent delta review',
    'beforeEntryFileCount': baseline['entryFileCount'],
    'beforeEntryDigest': baseline['entryDigest'],
    'changedExistingFiles': [path[len(prefix):] for path in changed],
    'unchangedExistingFiles': len(baseline['files']) - len(changed),
    'documentDigests': {
        name: {'before': baseline['files'][prefix + name], 'after': digest(entry / name)}
        for name in documents
    },
    'candidate15ProtectedInputs': protected,
    'candidate15ProtectedInputsState': 'REUSED; 13/13 byte hashes unchanged',
    'motionBrowserSuiteSha256': digest(root / suite),
    'browser': {'status': 'REUSED', 'entryCases': passed, 'entryCaseCount': 4,
                'batchPassed': 26, 'batchFailed': 3, 'batchFailuresEntry': 'B22',
                'record': browser_record},
    'sdk': 'REUSED 2 actual modern SDK SSR tests; no new execution',
    'policy': 'REUSED 4 reducer tests; no new execution',
    'officialReadme': {'path': readme['path'], 'bytes': 8259, 'sha256': readme['sha256']},
    'historicalRepositoryRootReadme': {'path': 'official/repository-root-readme.md',
                                      'bytes': 7475, 'sha256': digest(archived)},
    'formalReceiptStatuses': {kind: formal[kind]['status'] for kind in ['sdk', 'build', 'browser']},
    'formalVerificationUnchanged': True,
    'homepageStatus': 'unknown; no claim of successful iframe content',
    'markdownLocalLinks': links,
    'checks': {'facts': 'PASS', 'links': 'PASS', 'markdownWhitespaceAndFences': 'PASS',
               'protectedInputs': 'PASS', 'formalStates': 'PASS', 'diffCheck': 'PASS'},
    'diffCheck': {'cwd': str(lab), 'command': diff_command, 'exitCode': diff_run.returncode,
                  'log': 'validation/copy-fix-diff.txt'},
    'notRun': ['SDK re-run', 'policy re-run', 'browser re-run', 'HTTP re-fetch',
               'full build/typecheck/catalog', 'formal recorder']
}
(entry / 'validation/copy-fix-evidence.json').write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')
print('cwd=' + str(lab))
print('command=python entries/B21-react-motion-migration/validation/copy-fix-check.py')
print('PASS: exactly guide.md, agent.md, local-validation.md changed; 39 existing files unchanged')
print('PASS: candidate15 13 protected inputs and actual motion browser suite unchanged')
print('REUSED: SDK2, policy4, B21 browser4 PASS; mixed batch exit1/26PASS/3 B22 FAIL retained')
print('PASS: package README8259B/current hash, archived root README7475B/old hash')
print('PASS: local links=' + str({name: len(hrefs) for name, hrefs in links.items()}))
print('PASS: formal SDK/build/browser NOT_RUN unchanged; homepage unknown unchanged')
print('PASS: Markdown whitespace/fences and scoped git diff --check exit0')
print('NOT_RUN: SDK/policy/browser/HTTP/full workspace/formal recorder re-execution')
print('exitCode=0')
