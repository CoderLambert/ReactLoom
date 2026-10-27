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
