"""Controlled maintenance transport tests only; no HTTP, SDK or browser execution."""
import contextlib
import io
import hashlib
import json
from pathlib import Path
import runpy
import tempfile
import unittest
from unittest.mock import patch

ENTRY = Path(__file__).resolve().parents[1]
SCRIPT = (ENTRY / 'validation/fetch-official.py').read_bytes()
ORIGINAL_EVIDENCE = (ENTRY / 'official/source-evidence.json').read_bytes()
EVIDENCE = json.loads(ORIGINAL_EVIDENCE)
README = (ENTRY / 'official/readme.md').read_bytes()
COMMIT = EVIDENCE['commit']
HOMEPAGE = 'https://frappe.io/gantt'


class Response:
    def __init__(self, url):
        self.url = url
        self.status = 200
        self.headers = {'Content-Type': 'application/json', 'X-Controlled-Transport': 'fixture'}
        if url == 'https://registry.npmjs.org/frappe-gantt/1.2.2':
            self.data = json.dumps(EVIDENCE['package']).encode()
        elif url.endswith('/package.json'):
            self.data = json.dumps(EVIDENCE['manifest']).encode()
        elif url == f'https://api.github.com/repos/frappe/gantt/git/trees/{COMMIT}?recursive=1':
            self.data = json.dumps({'truncated': False, 'tree': [
                {'path': name, 'type': 'blob'} for name in EVIDENCE['readmeCandidates']
            ]}).encode()
        elif url == f'https://raw.githubusercontent.com/frappe/gantt/{COMMIT}/README.md':
            self.headers['Content-Type'] = 'text/plain'
            self.data = README
        elif url == HOMEPAGE:
            self.headers['X-Frame-Options'] = 'SAMEORIGIN'
            self.data = None
        else:
            raise AssertionError('Unexpected controlled URL ' + url)

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self):
        assert self.data is not None, 'Homepage body must remain NOT_READ'
        return self.data


def invoke(root, fail_at=None):
    validation = root / 'validation'
    validation.mkdir()
    script = validation / 'fetch-official.py'
    script.write_bytes(SCRIPT)
    seen = []

    def transport(request, timeout):
        assert timeout == 20
        seen.append(request.full_url)
        if len(seen) == fail_at:
            raise OSError('Controlled transport failure at request ' + str(fail_at))
        return Response(request.full_url)

    with patch('urllib.request.urlopen', side_effect=transport), contextlib.redirect_stdout(io.StringIO()):
        runpy.run_path(str(script), run_name='__main__')
    return seen


class SourceRefreshProtection(unittest.TestCase):
    @classmethod
    def tearDownClass(cls):
        assert (ENTRY / 'official/readme.md').read_bytes() == README
        assert (ENTRY / 'official/source-evidence.json').read_bytes() == ORIGINAL_EVIDENCE
        print('Live successful pair byte-identical; all scenarios ran only in disposable directories.')

    def test_complete_success_replaces_both_after_all_transfers(self):
        with tempfile.TemporaryDirectory(prefix='reactloom-c13-source-success-') as directory:
            root = Path(directory)
            official = root / 'official'
            official.mkdir()
            (official / 'readme.md').write_bytes(b'Previous successful snapshot sentinel')
            (official / 'source-evidence.json').write_text('{"previousSuccessfulPair":true}\n')
            seen = invoke(root)
            current = json.loads((official / 'source-evidence.json').read_text())
            self.assertEqual(len(seen), 5)
            self.assertEqual(len(current['requests']), 5)
            self.assertEqual((official / 'readme.md').read_bytes(), README)
            self.assertEqual(current['readme']['sha256'], EVIDENCE['readme']['sha256'])
            self.assertEqual(current['homepage']['status'], 'blocked')
            self.assertFalse((official / 'source-evidence.failed.json').exists())
            self.assertEqual(list(official.glob('.source-capture-*')), [])

    def assert_failure_preserves_previous(self, fail_at):
        with tempfile.TemporaryDirectory(prefix='reactloom-c13-source-failure-') as directory:
            root = Path(directory)
            official = root / 'official'
            official.mkdir()
            previous_readme = b'# Previous successful snapshot\n'
            previous_evidence = json.dumps({'previousSuccessfulPair': True, 'sha256': hashlib.sha256(previous_readme).hexdigest()}).encode()
            (official / 'readme.md').write_bytes(previous_readme)
            (official / 'source-evidence.json').write_bytes(previous_evidence)
            with self.assertRaisesRegex(OSError, 'Controlled transport failure'):
                invoke(root, fail_at)
            self.assertEqual((official / 'readme.md').read_bytes(), previous_readme)
            self.assertEqual((official / 'source-evidence.json').read_bytes(), previous_evidence)
            failed = json.loads((official / 'source-evidence.failed.json').read_text())
            self.assertEqual(failed['failure']['type'], 'OSError')
            self.assertEqual(len(failed['requests']), fail_at - 1)
            self.assertEqual(list(official.glob('.source-capture-*')), [])
            if fail_at == 5:
                self.assertEqual(failed['failure']['url'], HOMEPAGE)
                self.assertTrue(any(record['url'].endswith('/README.md') for record in failed['requests']))

    def test_first_request_failure_preserves_success_pair(self):
        self.assert_failure_preserves_previous(1)

    def test_homepage_failure_after_readme_preserves_success_pair(self):
        self.assert_failure_preserves_previous(5)


if __name__ == '__main__':
    # The live entry pair is checked before the suite. All executable fixtures are disposable copies.
    assert (ENTRY / 'official/readme.md').read_bytes() == README
    assert (ENTRY / 'official/source-evidence.json').read_bytes() == ORIGINAL_EVIDENCE
    unittest.main(verbosity=2)
