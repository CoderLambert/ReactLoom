"""Controlled transport tests for the maintenance tool only; no HTTP or SDK run."""
import contextlib
import hashlib
import io
import json
from pathlib import Path
import runpy
import tempfile
from unittest.mock import patch

ENTRY = Path(__file__).resolve().parents[1]
SCRIPT = (ENTRY / 'validation/fetch-official.py').read_bytes()
ORIGINAL_EVIDENCE = (ENTRY / 'official/source-evidence.json').read_bytes()
EVIDENCE = json.loads(ORIGINAL_EVIDENCE)
README = (ENTRY / 'official/readme.md').read_bytes()
COMMIT = EVIDENCE['commit']
HOMEPAGE = 'https://www.ag-grid.com/react-data-grid/'

class Response:
    def __init__(self, url):
        self.url = url
        self.status = 200
        self.headers = {'Content-Type': 'application/json', 'X-Controlled-Transport': 'fixture'}
        if url == 'https://registry.npmjs.org/ag-grid-react/36.2.0':
            self.data = json.dumps(EVIDENCE['registry']['react']).encode()
        elif url == 'https://registry.npmjs.org/ag-grid-community/36.2.0':
            self.data = json.dumps(EVIDENCE['registry']['community']).encode()
        elif url == f'https://api.github.com/repos/ag-grid/ag-grid/git/trees/{COMMIT}?recursive=1':
            self.data = json.dumps({'truncated': False, 'tree': [{'path': name} for name in EVIDENCE['readmeCandidates']]}).encode()
        elif url.endswith('/packages/ag-grid-react/package.json'):
            self.data = json.dumps(EVIDENCE['manifests']['react']).encode()
        elif url.endswith('/packages/ag-grid-community/package.json'):
            self.data = json.dumps(EVIDENCE['manifests']['community']).encode()
        elif url == f'https://raw.githubusercontent.com/ag-grid/ag-grid/{COMMIT}/packages/ag-grid-react/README.md':
            self.headers['Content-Type'] = 'text/plain'
            self.data = README
        elif url == HOMEPAGE:
            self.headers['Content-Security-Policy'] = "frame-ancestors 'self' https://*.ag-grid.com"
            self.data = b'Controlled homepage response, not an external page.'
        else:
            raise AssertionError('Unexpected fixture URL: ' + url)
    def __enter__(self):
        return self
    def __exit__(self, *args):
        return False
    def read(self):
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
            raise OSError('Controlled transport failure at request ' + str(fail_at))
        return Response(request.full_url)
    with patch('urllib.request.urlopen', side_effect=transport), contextlib.redirect_stdout(io.StringIO()):
        runpy.run_path(str(target), run_name='__main__')
    return seen

with tempfile.TemporaryDirectory(prefix='reactloom-c08-source-success-') as directory:
    root = Path(directory)
    official = root / 'official'
    official.mkdir()
    (official / 'readme.md').write_bytes(b'Previous successful README sentinel')
    (official / 'source-evidence.json').write_text('{"previousSuccessfulPair":true}\n')
    seen = invoke(root)
    actual = json.loads((official / 'source-evidence.json').read_text())
    assert len(seen) == len(actual['requests']) == 7
    assert (official / 'readme.md').read_bytes() == README
    assert actual['snapshot']['sha256'] == hashlib.sha256(README).hexdigest()
    assert actual['homepage']['status'] == 'blocked'
    assert not (official / 'source-evidence.failed.json').exists()
    assert not list(official.glob('.source-capture-*'))
    print('CONTROLLED SUCCESS: 7 fixture transfers; both artifacts staged after full acquisition, replacement checks passed; staging removed.')

for fail_at in [1, 7]:
    with tempfile.TemporaryDirectory(prefix='reactloom-c08-source-failure-') as directory:
        root = Path(directory)
        official = root / 'official'
        official.mkdir()
        (official / 'readme.md').write_bytes(README)
        (official / 'source-evidence.json').write_bytes(ORIGINAL_EVIDENCE)
        try:
            invoke(root, fail_at=fail_at)
        except OSError as error:
            assert 'Controlled transport failure' in str(error)
        else:
            raise AssertionError('Expected controlled transport failure')
        assert (official / 'readme.md').read_bytes() == README
        assert (official / 'source-evidence.json').read_bytes() == ORIGINAL_EVIDENCE
        failed = json.loads((official / 'source-evidence.failed.json').read_text())
        assert len(failed['requests']) == fail_at - 1
        assert failed['failure']['type'] == 'OSError'
        if fail_at == 7:
            assert failed['failure']['url'] == HOMEPAGE
            assert any(request['url'].endswith('/packages/ag-grid-react/README.md') for request in failed['requests'])
        assert not list(official.glob('.source-capture-*'))
        print(f'CONTROLLED FAILURE {fail_at}: old successful README/evidence byte-identical; attempt saved only in separate failed evidence.')

assert (ENTRY / 'official/readme.md').read_bytes() == README
assert (ENTRY / 'official/source-evidence.json').read_bytes() == ORIGINAL_EVIDENCE
print('3 controlled source-tool scenarios PASS; actual entry official pair untouched. No external HTTP, SDK, grid or browser receipt.')
