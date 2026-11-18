import pathlib,json,tempfile,runpy,unittest.mock,contextlib,io
entry=pathlib.Path(__file__).resolve().parents[1];ev=json.loads((entry/'official/source-evidence.json').read_text());raw=(entry/'official/readme.md').read_bytes();seen=[]
class Response:
 def __init__(self,url):self.url=url;self.status=200;self.headers={};self.data=None
 def __enter__(self):
  u=self.url;seen.append(u)
  if u.startswith('https://registry.npmjs.org/'):
   name=u.split('%2F')[1].split('/')[0];self.data=json.dumps(ev['packages'][name]).encode()
  elif '/git/ref/' in u:self.data=json.dumps({'object':{'type':'commit','sha':ev['commit']}}).encode()
  elif u.endswith('/packages/react/package.json'):self.data=json.dumps(ev['manifest']).encode()
  elif '/git/trees/' in u:self.data=json.dumps({'truncated':False,'tree':[{'path':p} for p in ev['readmeCandidates']]}).encode()
  elif u.endswith('/'+ev['readme']['path']):self.data=raw
  elif u=='https://jsonforms.io/':self.headers={'Content-Security-Policy':"frame-ancestors 'self'",'X-Frame-Options':'SAMEORIGIN'}
  else:raise AssertionError('Unexpected fixture URL '+u)
  return self
 def read(self):
  assert self.data is not None,'Homepage body must not be read'
  return self.data
 def __exit__(self,*args):pass
with tempfile.TemporaryDirectory(prefix='reactloom-c04-source-tool-') as temp:
 root=pathlib.Path(temp);(root/'validation').mkdir();target=root/'validation/fetch-official.py';target.write_bytes((entry/'validation/fetch-official.py').read_bytes())
 with unittest.mock.patch('urllib.request.urlopen',side_effect=lambda req,timeout:Response(req.full_url)):
  runpy.run_path(str(target),run_name='__main__')
 actual=json.loads((root/'official/source-evidence.json').read_text());assert (root/'official/readme.md').read_bytes()==raw;assert actual['readme']['bodyStatus']=='READ';assert actual['homepage']['status']=='blocked';assert len(seen)==8;print('CONTROLLED TRANSPORT FIXTURE ONLY: source-script full path, 8 requests, original README bytes preserved; no external-source or SDK receipt.')

with tempfile.TemporaryDirectory(prefix='reactloom-c04-source-failure-') as temp:
 root=pathlib.Path(temp);(root/'validation').mkdir();(root/'official').mkdir();target=root/'validation/fetch-official.py';target.write_bytes((entry/'validation/fetch-official.py').read_bytes())
 original_evidence=(entry/'official/source-evidence.json').read_bytes();(root/'official/source-evidence.json').write_bytes(original_evidence);(root/'official/readme.md').write_bytes(raw)
 def failing_transport(req,timeout):
  if req.full_url=='https://jsonforms.io/':raise OSError('Controlled transport failure after README received')
  return Response(req.full_url)
 try:
  with unittest.mock.patch('urllib.request.urlopen',side_effect=failing_transport):runpy.run_path(str(target),run_name='__main__')
 except OSError as error:assert 'Controlled transport failure' in str(error)
 else:raise AssertionError('Expected controlled failure')
 assert (root/'official/source-evidence.json').read_bytes()==original_evidence;assert (root/'official/readme.md').read_bytes()==raw;assert (root/'official/source-evidence.failed.json').exists();print('CONTROLLED FAILURE: previous successful evidence and original bytes preserved; failed attempt separate.')
