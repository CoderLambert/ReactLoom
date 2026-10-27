import test from 'node:test';
import assert from 'node:assert/strict';
import {configureStore,createSlice} from '@reduxjs/toolkit';

const slice=createSlice({name:'feeds',initialState:{items:[],active:null,ignored:0,result:''},
 reducers:{
  add(state,action){state.items.push(action.payload);},
  start(state,action){state.active=action.payload;},
  done(state,action){if(state.active!==action.payload.id){state.ignored++;return;}state.result=action.payload.text;state.active=null;},
 }});
function create(){return configureStore({reducer:{feeds:slice.reducer},devTools:false});}
test('real RTK slice preserves prior state and isolates separate stores',()=>{
 const a=create(),b=create();
 const before=a.getState();
 a.dispatch(slice.actions.add({id:'a'}));
 assert.notStrictEqual(a.getState(),before);
 assert.deepEqual(before.feeds.items,[]);
 assert.equal(a.getState().feeds.items.length,1);
 assert.equal(b.getState().feeds.items.length,0);
});
test('real RTK reducer rejects out-of-order async response id',()=>{
 const store=create();
 store.dispatch(slice.actions.start('old'));store.dispatch(slice.actions.start('new'));
 store.dispatch(slice.actions.done({id:'new',text:'fresh'}));
 store.dispatch(slice.actions.done({id:'old',text:'stale'}));
 assert.equal(store.getState().feeds.result,'fresh');
 assert.equal(store.getState().feeds.ignored,1);
});
