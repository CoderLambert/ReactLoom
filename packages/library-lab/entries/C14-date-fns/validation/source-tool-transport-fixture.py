"""Controlled transport only: not new official HTTP or SDK evidence."""
import contextlib, io, json, runpy, tempfile, unittest
from email.message import Message
from pathlib import Path
from unittest.mock import patch

ENTRY = Path(__file__).resolve().parents[1]
EVIDENCE = json.loads((ENTRY / 'official/source-evidence.json').read_text())
RAW = {name: (ENTRY / record['snapshotPath']).read_bytes() for name, record in EVIDENCE['readmes'].items()}
URLS = [request['url'] for request in EVIDENCE['requests']]
PAYLOAD = {}
for name, record in EVIDENCE['registry'].items():
    PAYLOAD[next(url for url in URLS if url.startswith('https://registry.npmjs.org/') and url.endswith('/' + record['version']))] = json.dumps(record).encode()
PAYLOAD[next(url for url in URLS if '/git/ref/tags/' in url)] = json.dumps({'object': EVIDENCE['tag']['object']}).encode()
for name, record in EVIDENCE['manifests'].items():
    PAYLOAD[next(url for url in URLS if url.endswith('/' + record['path']))] = json.dumps(record).encode()
PAYLOAD[next(url for url in URLS if '/git/trees/' in url)] = json.dumps({'truncated': False, 'tree': [{'type': 'blob', 'path': path} for path in EVIDENCE['readmeCandidates']]}).encode()
for name, record in EVIDENCE['readmes'].items():
    PAYLOAD[next(url for url in URLS if url.endswith('/' + record['path']))] = RAW[name]

class Response:
    def __init__(self, url):
        self.url = url
        self.status = 200
        self.headers = Message()
        self.headers.add_header('Content-Type', 'application/octet-stream')
        self.headers.add_header('X-Controlled-Repeat', 'first')
        self.headers.add_header('X-Controlled-Repeat', 'second')
    def __enter__(self):
        return self
    def __exit__(self, *args):
        pass
    def read(self):
        assert self.url != URLS[-1], 'Homepage body must remain unread'
        return PAYLOAD[self.url]

class CaptureTests(unittest.TestCase):
    def scenario(self, failure):
        with tempfile.TemporaryDirectory(prefix='reactloom-c14-transport-') as temporary:
            root = Path(temporary)
            (root / 'validation').mkdir()
            (root / 'official').mkdir()
            target = root / 'validation/fetch-official.py'
            target.write_bytes((ENTRY / 'validation/fetch-official.py').read_bytes())
            old = {'readme.md': b'previous-main-original', 'tz-readme.md': b'previous-tz-original', 'source-evidence.json': b'{"previous":"complete-evidence"}\n'}
            for name, data in old.items():
                (root / 'official' / name).write_bytes(data)
            seen = []
            def transport(request, timeout):
                url = request.full_url
                seen.append(url)
                if (failure == 'first' and len(seen) == 1) or (failure == 'after-readmes' and url == URLS[-1]):
                    raise OSError('controlled transfer failure ' + failure)
                return Response(url)
            with patch('urllib.request.urlopen', side_effect=transport), contextlib.redirect_stdout(io.StringIO()):
                if failure:
                    with self.assertRaisesRegex(OSError, 'controlled transfer failure'):
                        runpy.run_path(str(target), run_name='__main__')
                    for name, data in old.items():
                        self.assertEqual((root / 'official' / name).read_bytes(), data)
                    error = json.loads((root / 'official/source-evidence.failed.json').read_text())
                    self.assertEqual(error['failure']['url'], seen[-1])
                else:
                    runpy.run_path(str(target), run_name='__main__')
                    self.assertEqual((root / 'official/readme.md').read_bytes(), RAW['date-fns'])
                    self.assertEqual((root / 'official/tz-readme.md').read_bytes(), RAW['@date-fns/tz'])
                    actual = json.loads((root / 'official/source-evidence.json').read_text())
                    self.assertEqual(len(seen), len(URLS))
                    self.assertEqual(actual['homepage']['status'], 'unknown')
                    self.assertEqual(actual['requests'][-1]['bodyStatus'], 'NOT_READ')
                    self.assertEqual([value for key, value in actual['requests'][-1]['rawHeaders'] if key == 'X-Controlled-Repeat'], ['first', 'second'])
                    self.assertEqual(actual['readmes'], EVIDENCE['readmes'])
    def test_complete_success(self):
        self.scenario(None)
    def test_first_request_failure_preserves_three_old_artifacts(self):
        self.scenario('first')
    def test_homepage_failure_after_both_readmes_preserves_three_old_artifacts(self):
        self.scenario('after-readmes')

if __name__ == '__main__':
    unittest.main(verbosity=2)
