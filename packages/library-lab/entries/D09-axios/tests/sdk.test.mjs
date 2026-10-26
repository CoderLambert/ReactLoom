import test from 'node:test';
import assert from 'node:assert/strict';
import axios, {AxiosError,AxiosHeaders} from 'axios';
test('real Axios request/response interceptor chain with isolated adapter',async()=>{
 const logs=[];const client=axios.create({baseURL:'https://lab.invalid',adapter:async config=>{
  assert.equal(config.headers.get('X-Lab'),'test');
  logs.push(config.url);return {data:{ok:true},status:200,statusText:'OK',headers:new AxiosHeaders(),config};
 }});
 const req=client.interceptors.request.use(config=>{config.headers.set('X-Lab','test');return config;});
 const res=client.interceptors.response.use(response=>({...response,data:{...response.data,intercepted:true}}));
 const response=await client.get('/feed');
 assert.deepEqual(response.data,{ok:true,intercepted:true});
 assert.deepEqual(logs,['/feed']);client.interceptors.request.eject(req);client.interceptors.response.eject(res);
});
test('actual AxiosError identifies 409 returned by custom adapter',async()=>{
 const client=axios.create({adapter:async config=>{
  const response={status:409,statusText:'Conflict',headers:new AxiosHeaders(),data:{error:'version_conflict'},config};
  throw new AxiosError('conflict',AxiosError.ERR_BAD_RESPONSE,config,undefined,response);
 }});
 await assert.rejects(client.post('https://lab.invalid/follow',{id:1}),error=>{
  assert.equal(axios.isAxiosError(error),true);
  assert.equal(error.response?.status,409);return true;
 });
});
test('actual Axios respects a pre-aborted signal',async()=>{
 const controller=new AbortController();controller.abort();
 const client=axios.create({adapter:async config=>({status:200,statusText:'OK',data:1,config,headers:new AxiosHeaders()})});
 await assert.rejects(client.get('https://lab.invalid/blocked',{signal:controller.signal}),error=>axios.isCancel(error));
});

test('Axios getUri constructs actual baseURL and query params for adapter routing',async()=>{
 const client=axios.create({baseURL:'https://lab.invalid',adapter:async config=>{
  const url=new URL(axios.getUri(config));
  assert.equal(url.origin,'https://lab.invalid');
  assert.equal(url.pathname,'/feeds');
  assert.equal(url.searchParams.get('tenant'),'b');
  assert.equal(url.searchParams.get('q'),'React');
  return {data:[],status:200,statusText:'OK',headers:new AxiosHeaders(),config};
 }});
 await client.get('/feeds',{params:{tenant:'b',q:'React'}});
});
