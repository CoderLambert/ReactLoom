"""Disposable HTTP transport fixtures for the source tool; not SDK/official HTTP evidence."""
import contextlib
import hashlib
import io
import json
from pathlib import Path
import runpy
import tempfile
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).with_name('fetch-official.py')
COMMIT = '0d2845a2360dcc236fe9681f849781f5dfdd35c4'
README = b'# Controlled transport fixture README\n'


class Headers:
    def __init__(self, pairs):
        self.pairs = pairs

    def items(self):
        return iter(self.pairs)


class Response:
    def __init__(self, url, body, headers):
        self.url, self.body, self.status = url, body, 200
        self.headers = Headers(headers)

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def read(self):
        return self.body


class SourceToolTransport(unittest.TestCase):
    def exercise(self, fail_at=None):
        with tempfile.TemporaryDirectory(prefix='c17-source-tool-') as directory:
            entry = Path(directory)
            (entry / 'validation').mkdir()
            (entry / 'official').mkdir()
            copied = entry / 'validation/fetch-official.py'
            copied.write_bytes(SCRIPT.read_bytes())
            old_readme = b'# PREVIOUS verified README sentinel\n'
            old_evidence = b'{"previous":"different successful evidence sentinel"}\n'
            (entry / 'official/readme.md').write_bytes(old_readme)
            (entry / 'official/source-evidence.json').write_bytes(old_evidence)
            calls = []

            def transport(request, timeout):
                self.assertEqual(timeout, 30)
                url = request.full_url
                calls.append(url)
                if len(calls) == fail_at:
                    raise OSError('controlled transport failure')
                payloads = [
                    {'name': 'i18next', 'version': '26.4.3', 'gitHead': COMMIT, 'license': 'MIT'},
                    {'object': {'type': 'commit', 'sha': COMMIT}},
                    {'truncated': False, 'tree': [{'type': 'blob', 'path': 'README.md'}]},
                    {'name': 'i18next', 'version': '26.4.3', 'license': 'MIT', 'homepage': 'https://www.i18next.com'},
                ]
                number = len(calls)
                body = json.dumps(payloads[number - 1]).encode() if number <= 4 else README
                headers = [('Content-Type', 'text/plain')]
                if number == 6:
                    headers += [
                        ('Content-Security-Policy', "default-src 'self'; frame-ancestors https: ionic: capacitor:;"),
                        ('Content-Security-Policy', 'img-src https:'),
                        ('Set-Cookie', 'public_a=fixture-secret-a; Secure; HttpOnly'),
                        ('Set-Cookie', 'public_b=fixture-secret-b; Path=/'),
                    ]
                return Response(url, body, headers)

            with patch('urllib.request.urlopen', transport), contextlib.redirect_stdout(io.StringIO()):
                if fail_at:
                    with self.assertRaisesRegex(OSError, 'controlled transport failure'):
                        runpy.run_path(str(copied), run_name='__main__')
                else:
                    runpy.run_path(str(copied), run_name='__main__')
            if fail_at:
                self.assertEqual((entry / 'official/readme.md').read_bytes(), old_readme)
                self.assertEqual((entry / 'official/source-evidence.json').read_bytes(), old_evidence)
                failed = json.loads((entry / 'validation/source-evidence.failed.json').read_text())
                self.assertEqual(failed['failure']['url'], calls[-1])
                self.assertEqual(failed['failure']['type'], 'OSError')
                self.assertEqual(len(failed['requests']), fail_at - 1)
            else:
                self.assertEqual((entry / 'official/readme.md').read_bytes(), README)
                evidence = json.loads((entry / 'official/source-evidence.json').read_text())
                self.assertEqual(evidence['readme']['sha256'], hashlib.sha256(README).hexdigest())
                self.assertEqual(evidence['homepage']['status'], 'blocked')
                raw = evidence['requests'][-1]['rawHeaders']
                self.assertEqual(sum(key == 'Content-Security-Policy' for key, _ in raw), 2)
                self.assertEqual(sum(key == 'Set-Cookie' for key, _ in raw), 2)
                self.assertEqual(len(evidence['requests'][-1]['redactions']), 2)
                self.assertNotIn('fixture-secret', json.dumps(evidence))
                self.assertFalse((entry / 'validation/source-evidence.failed.json').exists())
            self.assertEqual(len(calls), fail_at or 6)
            self.assertFalse(list((entry / 'official').glob('.source-capture-*')))

    def test_complete_capture_commits_both_and_keeps_raw_duplicates(self):
        self.exercise()

    def test_first_failure_keeps_previous_success_pair(self):
        self.exercise(fail_at=1)

    def test_homepage_failure_after_readme_keeps_previous_success_pair(self):
        self.exercise(fail_at=6)


if __name__ == '__main__':
    unittest.main(verbosity=2)
