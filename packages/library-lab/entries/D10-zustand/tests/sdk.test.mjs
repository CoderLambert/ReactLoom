import test from 'node:test';
import assert from 'node:assert/strict';
import {createStore} from 'zustand/vanilla';
import {persist,createJSONStorage} from 'zustand/middleware';

test('real Zustand vanilla store independently isolates two tenant instances',()=>{
 const factory=()=>createStore()(set=>({tenant:'a',enabled:{a:true,b:false},toggle:()=>set(s=>({enabled:{...s.enabled,[s.tenant]:!s.enabled[s.tenant]}}))}));
 const first=factory(),second=factory();
 first.getState().toggle();
 assert.equal(first.getState().enabled.a,false);
 assert.equal(second.getState().enabled.a,true);
});
test('real Zustand persist serializes only whitelisted data and rehydrates',async()=>{
 const map=new Map();
 const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>{map.set(k,v)},removeItem:k=>map.delete(k)};
 const factory=()=>createStore()(persist((set)=>({view:'list',token:'never-persist',setView:view=>set({view})}),
  {name:'zustand-fixture',version:2,storage:createJSONStorage(()=>storage),skipHydration:true,
   partialize:s=>({view:s.view})}));
 const a=factory();a.getState().setView('grid');
 assert.equal(map.get('zustand-fixture').includes('never-persist'),false);
 const b=factory();await b.persist.rehydrate();assert.equal(b.getState().view,'grid');
 assert.equal(b.getState().token,'never-persist');
});
test('real middleware invokes versioned migrate',async()=>{
 const map=new Map([['migration',JSON.stringify({state:{oldValue:42},version:1})]]);
 const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>{map.set(k,v)},removeItem:k=>map.delete(k)};
 const store=createStore()(persist(()=>({value:0}),
  {name:'migration',version:2,storage:createJSONStorage(()=>storage),skipHydration:true,
   migrate:(old,v)=>({value:v===1?old.oldValue:0})}));
 await store.persist.rehydrate();assert.equal(store.getState().value,42);
});
