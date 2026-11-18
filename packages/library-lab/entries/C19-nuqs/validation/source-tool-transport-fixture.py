"""Controlled transfer fixture only. No official network, SDK or browser evidence."""
import contextlib
from email.message import Message
import hashlib
import io
import json
from pathlib import Path
import runpy
import tempfile
import unittest
from unittest.mock import patch

ENTRY = Path(__file__).resolve().parents[1]
EVIDENCE = json.loads((ENTRY/'official/source-evidence.json').read_text())
URLS = [record['url'] for record in EVIDENCE['requests']]
PAYLOADS = {
    URLS[0]: json.dumps(EVIDENCE['registry']).encode(),
    URLS[1]: json.dumps({'truncated': False, 'tree': [{'type':'blob', 'path':path} for path in EVIDENCE['readmeCandidates']]}).encode(),
    URLS[2]: json.dumps(EVIDENCE['manifest']).encode(),
    URLS[3]: (ENTRY/'official/readme.md').read_bytes(),
}

class Response:
    def __init__(self, url):
        self.url = url
        self.status = 200
        self.headers = Message()
        self.headers.add_header('X-Controlled-Repeat', 'first')
        self.headers.add_header('X-Controlled-Repeat', 'second')
        self.headers.add_header('Set-Cookie', 'fixture-one=one; Secure')
        self.headers.add_header('Set-Cookie', 'fixture-two=two; HttpOnly')
    def __enter__(self): return self
    def __exit__(self, *args): pass
    def read(self):
        assert self.url != URLS[-1], 'Homepage body stays unread'
        return PAYLOADS[self.url]

class TransferTests(unittest.TestCase):
    def scenario(self, fail_at):
        with tempfile.TemporaryDirectory(prefix='reactloom-c19-transfer-') as temporary:
            target = Path(temporary)
            (target/'validation').mkdir()
            (target/'official').mkdir()
            recipe = target/'validation/fetch-official.py'
            recipe.write_bytes((ENTRY/'validation/fetch-official.py').read_bytes())
            original = {'readme.md': b'previous-successful-original', 'source-evidence.json': b'{"previous":"successful-evidence"}\n'}
            for name,data in original.items(): (target/'official'/name).write_bytes(data)
            seen = []
            def transport(request, timeout):
                url = request.full_url
                seen.append(url)
                if len(seen) == fail_at: raise OSError('controlled transport failure')
                return Response(url)
            with patch('urllib.request.urlopen', side_effect=transport), contextlib.redirect_stdout(io.StringIO()):
                if fail_at:
                    with self.assertRaisesRegex(OSError, 'controlled transport failure'):
                        runpy.run_path(str(recipe), run_name='__main__')
                    for name,data in original.items(): self.assertEqual((target/'official'/name).read_bytes(),data)
                    failed = json.loads((target/'official/source-evidence.failed.json').read_text())
                    self.assertEqual(failed['failure']['url'],seen[-1])
                else:
                    runpy.run_path(str(recipe), run_name='__main__')
                    self.assertEqual((target/'official/readme.md').read_bytes(),PAYLOADS[URLS[3]])
                    actual = json.loads((target/'official/source-evidence.json').read_text())
                    self.assertEqual(len(seen),5)
                    self.assertEqual(actual['snapshot']['sha256'],hashlib.sha256(PAYLOADS[URLS[3]]).hexdigest())
                    self.assertEqual(actual['homepage']['status'],'unknown')
                    for record in actual['requests']:
                        self.assertEqual([value for key,value in record['rawHeaders'] if key=='X-Controlled-Repeat'],['first','second'])
                        cookies = [value for key,value in record['rawHeaders'] if key=='Set-Cookie']
                        self.assertEqual(len(cookies),2)
                        self.assertTrue(all(value.startswith('<REDACTED_PUBLIC_COOKIE_SHA256:') for value in cookies))
                    self.assertEqual(actual['requests'][-1]['bodyStatus'],'NOT_READ')
    def test_success_preserves_repeated_headers(self): self.scenario(None)
    def test_first_failure_preserves_previous_success_pair(self): self.scenario(1)
    def test_homepage_failure_after_readme_preserves_previous_success_pair(self): self.scenario(5)

if __name__ == '__main__': unittest.main(verbosity=2)
