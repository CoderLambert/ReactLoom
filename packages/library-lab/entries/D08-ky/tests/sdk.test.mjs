import test from 'node:test';
import assert from 'node:assert/strict';
import ky,{isHTTPError,isResponseSizeError} from 'ky';

test('real Ky retries an idempotent GET 503 but not a POST 409',async()=>{
  const seen=new Map();
  const fetch=async(input)=>{
    const request=new Request(input);
    const url=new URL(request.url);
    assert.equal(url.origin,'https://lab.invalid');
    const key=request.method+url.pathname;
    seen.set(key,(seen.get(key)??0)+1);
    if(key==='GET/retry')return seen.get(key)===1?new Response('unavailable',{status:503}):Response.json({ok:true});
    if(key==='POST/follow')return Response.json({message:'conflict'},{status:409});
    return new Response('missing',{status:404});
  };
  const client=ky.create({fetch,retry:{limit:1,methods:['get'],statusCodes:[503]},timeout:2500,totalTimeout:4000});
  assert.deepEqual(await client.get('https://lab.invalid/retry').json(),{ok:true});
  assert.equal(seen.get('GET/retry'),2);
  await assert.rejects(client.post('https://lab.invalid/follow',{json:{version:1},retry:{limit:0}}),
    error=>isHTTPError(error)&&error.response.status===409);
  assert.equal(seen.get('POST/follow'),1);
});

test('real Ky fails a bounded response body and handles 204 without JSON',async()=>{
  const client=ky.create({fetch:async request=>{
    const url=new URL(new Request(request).url);
    if(url.pathname==='/large')return new Response('z'.repeat(2000));
    return new Response(null,{status:204});
  },retry:{limit:0}});
  await assert.rejects(client.get('https://lab.invalid/large',{maxResponseSize:64}).text(),
    error=>isResponseSizeError(error));
  const response=await client.delete('https://lab.invalid/removed');
  assert.equal(response.status,204);
});
