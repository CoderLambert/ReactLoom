import test from 'node:test';
import assert from 'node:assert/strict';
const id='01234567-89ab-4cde-8fab-0123456789ab';
async function api(){let m;try{m=await import('../src/lib/frame-session.mjs');}catch{}assert.equal(typeof m?.createMswFrameSession,'function');return m;}
function fixture(){
 const listeners=new Set(),events=[],sent=[];
 const frame={hidden:false,setAttribute(){},contentWindow:{postMessage:(...args)=>sent.push(args)},remove(){this.removed=true;}};
 const window={location:{origin:'http://127.0.0.1:4319'},crypto:{randomUUID:()=>id},document:{createElement:()=>frame,body:{appendChild(){}}},addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn),setTimeout,clearTimeout};
 const send=(data,origin='http://127.0.0.1:4320',source=frame.contentWindow)=>{for(const fn of [...listeners])fn({data,origin,source});};
 const packet=(type,extra={})=>({protocol:'reactloom-msw-v1',session:id,type,...extra});
 return {window,frame,events,sent,send,packet,listeners};
}
test('cross-origin runner validates source, origin and session before start/result',async()=>{
 const {createMswFrameSession}=await api(),f=fixture();
 const session=createMswFrameSession({window:f.window,level:'basic',onEvent:e=>f.events.push(e)});
 f.send(f.packet('ready'),'https://attacker.invalid');f.send(f.packet('ready'),undefined,{});f.send({...f.packet('ready'),session:'wrong'});
 assert.equal(f.sent.length,0);
 f.send(f.packet('ready'));f.send(f.packet('ready'));
 assert.equal(f.sent.length,1);assert.equal(f.sent[0][1],'http://127.0.0.1:4320');
 const result={requests:[{method:'GET',status:200,url:`http://127.0.0.1:4320/lab-runners/msw/sessions/${id}/api/articles/42`,body:'{}'}]};
 f.send(f.packet('result',result));assert.equal(f.events.at(-1).type,'result');
 const disposed=session.dispose();f.send(f.packet('stopped',{cleanup:true}));assert.equal(await disposed,true);assert.equal(f.frame.removed,true);assert.equal(f.listeners.size,0);
});
test('stop before ready never starts the SDK and joins repeated cleanup',async()=>{
 const {createMswFrameSession}=await api(),f=fixture();const s=createMswFrameSession({window:f.window,level:'basic',onEvent:()=>{}});
 const first=s.dispose(),second=s.dispose();assert.equal(first,second);
 f.send(f.packet('ready'));assert.equal(f.sent.some(([p])=>p.type==='start'),false);
 f.send(f.packet('stopped',{cleanup:true}));assert.equal(await first,true);
});
test('teardown deadline reports unconfirmed cleanup and removes the orphan frame',async()=>{
 const {createMswFrameSession}=await api(),f=fixture();const s=createMswFrameSession({window:f.window,level:'basic',onEvent:e=>f.events.push(e),stopTimeoutMs:10});
 assert.equal(await s.dispose(),false);assert.equal(f.frame.removed,true);assert.equal(f.events.at(-1).type,'cleanup-unconfirmed');assert.equal(f.listeners.size,0);
});
test('unknown levels, main origins and oversized payloads fail closed',async()=>{
 const {createMswFrameSession}=await api(),f=fixture();
 assert.throws(()=>createMswFrameSession({window:f.window,level:'shell',onEvent:()=>{}}));
 f.window.location.origin='https://public.invalid';assert.throws(()=>createMswFrameSession({window:f.window,level:'basic',onEvent:()=>{}}));
 f.window.location.origin='http://127.0.0.1:4319';const s=createMswFrameSession({window:f.window,level:'basic',onEvent:e=>f.events.push(e)});
 f.send(f.packet('result',{requests:new Array(500).fill({})}));assert.equal(f.events.some(e=>e.type==='result'),false);
 const end=s.dispose();f.send(f.packet('stopped',{cleanup:true}));await end;
});
