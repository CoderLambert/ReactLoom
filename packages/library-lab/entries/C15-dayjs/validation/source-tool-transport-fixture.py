"""Source-tool transport fixtures only; no external HTTP, Day.js or browser run."""
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
NAMES = ['readme.md', 'package-readme.md', 'source-evidence.json']
ORIGINAL = {name: (ENTRY / 'official' / name).read_bytes() for name in NAMES}
EVIDENCE = json.loads(ORIGINAL['source-evidence.json'])
COMMIT = EVIDENCE['commit']
HOME = EVIDENCE['homepage']['url']

class Response:
    def __init__(self, url):
        self.url, self.status = url, 200
        self.headers = Message()
        self.headers.add_header('Content-Type', 'application/json')
        self.headers.add_header('X-Controlled-Transport', 'fixture')
        if url == 'https://registry.npmjs.org/dayjs/1.11.23':
            value = EVIDENCE['release']
        elif url.endswith('/git/ref/tags/v1.11.23'):
            value = {'object': {'type': 'commit', 'sha': COMMIT}}
        elif url.endswith('/git/trees/' + COMMIT + '?recursive=1'):
            value = {'truncated': False, 'tree': [{'type': 'blob', 'path': path} for path in EVIDENCE['readmeCandidates']]}
        elif url.endswith('/package.json'):
            value = EVIDENCE['manifest']
        elif url.endswith('/' + EVIDENCE['readme']['path']):
            self.data = ORIGINAL['readme.md']
            return
        elif url.endswith('/README.md'):
            self.data = ORIGINAL['package-readme.md']
            return
        elif url == HOME:
            self.headers.add_header('Set-Cookie', 'fixture-a=secret-a; Secure; HttpOnly')
            self.headers.add_header('Set-Cookie', 'fixture-b=secret-b; SameSite=Lax')
            self.data = None
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
            raise OSError('Controlled transport failure at ' + str(fail_at))
        return Response(request.full_url)
    with patch('urllib.request.urlopen', side_effect=transport), contextlib.redirect_stdout(io.StringIO()):
        runpy.run_path(str(target), run_name='__main__')
    return seen

with tempfile.TemporaryDirectory(prefix='reactloom-c15-source-success-') as directory:
    root = Path(directory)
    official = root / 'official'
    official.mkdir()
    for name in NAMES:
        (official / name).write_bytes(b'Previous successful sentinel ' + name.encode())
    seen = invoke(root)
    actual = json.loads((official / 'source-evidence.json').read_text())
    assert len(seen) == len(actual['requests']) == 7
    assert (official / 'readme.md').read_bytes() == ORIGINAL['readme.md']
    assert (official / 'package-readme.md').read_bytes() == ORIGINAL['package-readme.md']
    assert actual['readme']['sha256'] == hashlib.sha256(ORIGINAL['readme.md']).hexdigest()
    assert actual['versionBasis']['sourceManifestVersion'] == '0.0.0-development'
    assert actual['tagCommit'] == actual['release']['gitHead'] == COMMIT
    assert actual['homepage']['status'] == 'unknown'
    home = actual['requests'][-1]
    cookies = [value for key, value in home['rawHeaders'] if key.lower() == 'set-cookie']
    assert len(cookies) == len(home['redactions']) == 2
    assert all('<REDACTED_PUBLIC_COOKIE>' in value and 'secret-' not in value for value in cookies)
    assert home['bodyStatus'] == 'NOT_READ'
    assert not list(official.glob('.source-capture-*'))
    print('CONTROLLED SUCCESS: 7 transfers, discovered Chinese source, exact tag/gitHead, truthful development manifest, staged three successful artifacts, duplicate cookie attributes/redaction, homepage NOT_READ.')

for fail_at in [1, 7]:
    with tempfile.TemporaryDirectory(prefix='reactloom-c15-source-failure-') as directory:
        root = Path(directory)
        official = root / 'official'
        official.mkdir()
        previous = {'readme.md': b'# Previous Chinese README\n', 'package-readme.md': b'# Previous English README\n', 'source-evidence.json': b'{"previousSuccessfulCapture":true}\n'}
        for name, data in previous.items():
            (official / name).write_bytes(data)
        try:
            invoke(root, fail_at)
        except OSError as error:
            assert 'Controlled transport failure' in str(error)
        else:
            raise AssertionError('Expected controlled failure')
        assert all((official / name).read_bytes() == data for name, data in previous.items())
        failure = json.loads((root / 'validation/source-evidence.failed.json').read_text())
        assert failure['failure']['type'] == 'OSError'
        assert len(failure['requests']) == fail_at - 1
        if fail_at == 7:
            assert failure['failure']['url'] == HOME
            assert failure['requests'][-1]['url'].endswith('/' + EVIDENCE['readme']['path'])
        assert not list(official.glob('.source-capture-*'))
        print(f'CONTROLLED FAILURE {fail_at}: previous successful Chinese/English/evidence artifacts byte-identical; only separate failed attempt written.')

assert all((ENTRY / 'official' / name).read_bytes() == data for name, data in ORIGINAL.items())
print('3 controlled source-tool scenarios PASS; live successful artifacts unchanged. No external HTTP/SDK/UI/browser receipt.')
