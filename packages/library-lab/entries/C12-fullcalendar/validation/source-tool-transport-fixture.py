"""Controlled source-tool transport, not real HTTP or a FullCalendar test."""
from pathlib import Path
from email.message import Message
from unittest.mock import patch
import contextlib
import hashlib
import io
import json
import runpy
import tempfile

ENTRY = Path(__file__).resolve().parents[1]
SCRIPT = (ENTRY / 'validation/fetch-official.py').read_bytes()
ORIGINAL = (ENTRY / 'official/source-evidence.json').read_bytes()
EVIDENCE = json.loads(ORIGINAL)
README = (ENTRY / 'official/readme.md').read_bytes()
COMMIT = EVIDENCE['commit']
TAG = EVIDENCE['tagObject']
HOME = 'https://fullcalendar.io/'

class Response:
    def __init__(self, url):
        self.url, self.status = url, 200
        self.headers = Message()
        self.headers.add_header('Content-Type', 'application/json')
        self.headers.add_header('X-Controlled-Transport', 'fixture')
        if url == 'https://registry.npmjs.org/@fullcalendar%2Freact/7.1.3':
            value = EVIDENCE['release']
        elif url == 'https://registry.npmjs.org/temporal-polyfill/1.0.4':
            value = EVIDENCE['polyfill']
        elif url.endswith('/git/ref/tags/v7.1.3'):
            value = {'object': {'type': 'tag', 'sha': TAG}}
        elif url.endswith('/git/tags/' + TAG):
            value = {'object': {'type': 'commit', 'sha': COMMIT}}
        elif url.endswith('/git/trees/' + COMMIT + '?recursive=1'):
            value = {'truncated': False, 'tree': [{'path': name} for name in EVIDENCE['readmeCandidates']]}
        elif url.endswith('/packages/react/package.json'):
            value = EVIDENCE['manifest']
        elif url.endswith('/packages/react/README.md'):
            self.data = README
            return
        elif url == HOME:
            self.headers.add_header('X-Frame-Options', 'DENY')
            self.headers.add_header('Content-Security-Policy', "frame-ancestors 'none'")
            self.headers.add_header('Set-Cookie', 'fixture-a=secret-a; Secure; HttpOnly')
            self.headers.add_header('Set-Cookie', 'fixture-b=secret-b; SameSite=Lax')
            self.data = b'Controlled response; the homepage body must not be read.'
            return
        else:
            raise AssertionError('Unexpected fixture URL: ' + url)
        self.data = json.dumps(value).encode()
    def __enter__(self):
        return self
    def __exit__(self, *args):
        return False
    def read(self):
        assert self.url != HOME, 'Homepage body must remain NOT_READ'
        return self.data

def invoke(root, fail_at=None):
    validation = root / 'validation'
    validation.mkdir()
    target = validation / 'fetch-official.py'
    target.write_bytes(SCRIPT)
    seen = []
    def transport(request, timeout):
        assert timeout == 30
        seen.append(request.full_url)
        if len(seen) == fail_at:
            raise OSError('Controlled transport failure ' + str(fail_at))
        return Response(request.full_url)
    with patch('urllib.request.urlopen', side_effect=transport), contextlib.redirect_stdout(io.StringIO()):
        runpy.run_path(str(target), run_name='__main__')
    return seen

with tempfile.TemporaryDirectory(prefix='reactloom-c12-source-success-') as directory:
    root = Path(directory)
    official = root / 'official'
    official.mkdir()
    (official / 'readme.md').write_bytes(b'Previous successful snapshot')
    (official / 'source-evidence.json').write_text('{"previous":true}\n')
    seen = invoke(root)
    actual = json.loads((official / 'source-evidence.json').read_text())
    assert len(seen) == len(actual['requests']) == 8
    assert (official / 'readme.md').read_bytes() == README
    assert actual['readme']['sha256'] == hashlib.sha256(README).hexdigest()
    assert actual['homepage']['status'] == 'blocked'
    last = actual['requests'][-1]
    cookies = [value for key, value in last['rawHeaders'] if key.lower() == 'set-cookie']
    assert len(cookies) == 2 and len(last['redactions']) == 2
    assert all('<REDACTED_PUBLIC_SESSION_COOKIE>' in value for value in cookies)
    assert not any('secret-' in value for value in cookies)
    assert last['bodyStatus'] == 'NOT_READ'
    assert not list(official.glob('.source-capture-*'))
    print('CONTROLLED SUCCESS: 8 transfers, version/tag/tree/README path executed; staged success pair; duplicate cookie attributes retained and values redacted; homepage NOT_READ.')

for fail_at in [1, 8]:
    with tempfile.TemporaryDirectory(prefix='reactloom-c12-source-failure-') as directory:
        root = Path(directory)
        official = root / 'official'
        official.mkdir()
        (official / 'readme.md').write_bytes(README)
        (official / 'source-evidence.json').write_bytes(ORIGINAL)
        try:
            invoke(root, fail_at)
        except OSError as error:
            assert 'Controlled transport failure' in str(error)
        else:
            raise AssertionError('Expected fixture failure')
        assert (official / 'readme.md').read_bytes() == README
        assert (official / 'source-evidence.json').read_bytes() == ORIGINAL
        failure = json.loads((root / 'validation/source-fetch-failure.json').read_text())
        assert len(failure['requests']) == fail_at - 1
        assert failure['failure']['type'] == 'OSError'
        if fail_at == 8:
            assert failure['failure']['url'] == HOME
            assert failure['requests'][-1]['url'].endswith('/packages/react/README.md')
        assert not list(official.glob('.source-capture-*'))
        print(f'CONTROLLED FAILURE {fail_at}: separate failure record; previous successful README/evidence pair byte-identical.')

assert (ENTRY / 'official/readme.md').read_bytes() == README
assert (ENTRY / 'official/source-evidence.json').read_bytes() == ORIGINAL
print('3 source-tool scenarios PASS; entry official files unchanged. No external HTTP, SDK, UI, or browser receipt.')
