"""Controlled urllib transport only; no official-network/SDK/browser evidence."""
import contextlib,io,json,runpy,tempfile,unittest
from email.message import Message
from pathlib import Path
from unittest.mock import patch
ENTRY=Path(__file__).resolve().parents[1]
E=json.loads((ENTRY/'official/source-evidence.json').read_text());URLS=[r['url'] for r in E['requests']]
P={URLS[0]:json.dumps(E['registry']).encode()}
for tag in E['tagChain']:P[tag['url']]=json.dumps(tag['response']).encode()
for url in URLS:
 if '/git/trees/' in url:P[url]=json.dumps({'truncated':False,'tree':[{'type':'blob','path':name} for name in E['readmeCandidates']]}).encode()
 elif url.endswith('/'+E['manifestPath']):P[url]=json.dumps(E['manifest']).encode()
 elif url.endswith('/'+E['path']):P[url]=(ENTRY/'official/readme.md').read_bytes()
class Response:
 def __init__(self,url):
  self.url=url;self.status=200;self.headers=Message()
  self.headers.add_header('X-Repeat','first');self.headers.add_header('X-Repeat','second')
  self.headers.add_header('Set-Cookie','fixture=x; Secure')
  if url==URLS[-1]:self.headers.add_header('Content-Security-Policy',"frame-ancestors 'none'")
 def __enter__(self):return self
 def __exit__(self,*args):pass
 def read(self):
  assert self.url!=URLS[-1],'Homepage body remains unread'
  return P[self.url]
class Capture(unittest.TestCase):
 def scenario(self,fail_at):
  with tempfile.TemporaryDirectory(prefix='reactloom-c21-transfer-') as temp:
   root=Path(temp);(root/'validation').mkdir();(root/'official').mkdir();script=root/'validation/fetch-official.py';script.write_bytes((ENTRY/'validation/fetch-official.py').read_bytes())
   old={'readme.md':b'previous-success-README','source-evidence.json':b'{"previous":"successful-pair"}\n'}
   for name,data in old.items():(root/'official'/name).write_bytes(data)
   seen=[]
   def transport(request,timeout):
    seen.append(request.full_url)
    if len(seen)==fail_at:raise OSError('controlled transport failure')
    return Response(request.full_url)
   with patch('urllib.request.urlopen',side_effect=transport),contextlib.redirect_stdout(io.StringIO()):
    if fail_at:
     with self.assertRaisesRegex(OSError,'controlled transport failure'):runpy.run_path(str(script),run_name='__main__')
     for name,data in old.items():self.assertEqual((root/'official'/name).read_bytes(),data)
     self.assertEqual(json.loads((root/'official/source-evidence.failed.json').read_text())['failure']['url'],seen[-1])
    else:
     runpy.run_path(str(script),run_name='__main__')
     actual=json.loads((root/'official/source-evidence.json').read_text());self.assertEqual(len(seen),len(URLS));self.assertEqual(actual['homepage']['status'],'blocked');self.assertEqual(actual['requests'][-1]['bodyStatus'],'NOT_READ')
     self.assertEqual((root/'official/readme.md').read_bytes(),P[URLS[-2]])
     for record in actual['requests']:
      self.assertEqual([v for k,v in record['rawHeaders'] if k=='X-Repeat'],['first','second'])
      self.assertTrue([v for k,v in record['rawHeaders'] if k=='Set-Cookie'][0].startswith('<REDACTED_PUBLIC_COOKIE_SHA256:'))
 def test_success(self):self.scenario(None)
 def test_first_failure_keeps_previous_pair(self):self.scenario(1)
 def test_homepage_after_readme_failure_keeps_previous_pair(self):self.scenario(len(URLS))
if __name__=='__main__':unittest.main(verbosity=2)
