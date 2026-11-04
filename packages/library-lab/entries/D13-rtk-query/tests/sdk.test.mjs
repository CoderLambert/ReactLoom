import test from 'node:test';
import assert from 'node:assert/strict';
import {configureStore} from '@reduxjs/toolkit';
import {createApi} from '@reduxjs/toolkit/query';
test('real RTK Query stores tenant-specific cache entries',async()=>{
 const api=createApi({
  reducerPath:'rtkTest',
  baseQuery:async(arg)=>({data:[{tenant:arg.tenant,value:arg.tenant}]}),
  endpoints:b=>({list:b.query({query:arg=>arg})})
 });
 const store=configureStore({reducer:{[api.reducerPath]:api.reducer},middleware:g=>g().concat(api.middleware)});
 const a=store.dispatch(api.endpoints.list.initiate({tenant:'a'}));
 const b=store.dispatch(api.endpoints.list.initiate({tenant:'b'}));
 await Promise.all([a,b]);
 assert.equal(api.endpoints.list.select({tenant:'a'})(store.getState()).data[0].tenant,'a');
 assert.equal(api.endpoints.list.select({tenant:'b'})(store.getState()).data[0].tenant,'b');
 a.unsubscribe();b.unsubscribe();store.dispatch(api.util.resetApiState());
});

test('real RTK Query invalidates only successful tenant mutation, not 409',async()=>{
 let readsA=0,readsB=0;
 const api=createApi({
  reducerPath:'scopedRtkTest',
  tagTypes:['Feeds'],
  baseQuery:async arg=>{
   if(arg.kind==='list'){
    if(arg.tenant==='a')readsA++;
    else readsB++;
    return {data:[{tenant:arg.tenant}]};
   }
   return arg.id==='blocked'?{error:{status:409,data:'conflict'}}:{data:{id:arg.id}};
  },
  endpoints:b=>({
   list:b.query({
    query:tenant=>({kind:'list',tenant}),
    providesTags:(_result,_error,tenant)=>[{type:'Feeds',id:tenant}]
   }),
   toggle:b.mutation({
    query:({tenant,id})=>({kind:'toggle',tenant,id}),
    invalidatesTags:(result,_error,args)=>result?[{type:'Feeds',id:args.tenant}]:[]
   })
  })
 });
 const store=configureStore({reducer:{[api.reducerPath]:api.reducer},middleware:g=>g().concat(api.middleware)});
 const left=store.dispatch(api.endpoints.list.initiate('a'));
 const right=store.dispatch(api.endpoints.list.initiate('b'));
 try{
  await Promise.all([left.unwrap(),right.unwrap()]);
  assert.equal(readsA,1);assert.equal(readsB,1);
  await store.dispatch(api.endpoints.toggle.initiate({tenant:'a',id:'ok'})).unwrap();
  await Promise.all(store.dispatch(api.util.getRunningQueriesThunk()));
  assert.equal(readsA,2);assert.equal(readsB,1);
  await assert.rejects(store.dispatch(api.endpoints.toggle.initiate({tenant:'a',id:'blocked'})).unwrap());
  await Promise.all(store.dispatch(api.util.getRunningQueriesThunk()));
  assert.equal(readsA,2,'409 must not trigger an unnecessary refetch');
 }finally{
  left.unsubscribe();right.unsubscribe();store.dispatch(api.util.resetApiState());
 }
});
