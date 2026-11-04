import {useEffect,useState} from 'react';
import {useStore} from 'zustand';
import {createStore} from 'zustand/vanilla';
import {persist,createJSONStorage,type StateStorage} from 'zustand/middleware';
import {migrateChannelPreferences} from './migration-policy.mjs';

type Level='basic'|'business'|'advanced';
type Tenant='team-a'|'team-b';
type View='grid'|'list';
type ChannelState={
 tenant:Tenant;view:View;enabledByTenant:Record<Tenant,boolean>;
 setTenant:(tenant:Tenant)=>void;setView:(view:View)=>void;toggle:()=>void;
};
type Persisted=Pick<ChannelState,'view'|'enabledByTenant'>;
const KEY='reactloom:lab:zustand:channels:v2';
export function makeMemoryStorage(){
 const data=new Map<string,string>();
 const storage:StateStorage={
  getItem:key=>data.get(key)??null,
  setItem:(key,value)=>{data.set(key,value);},
  removeItem:key=>{data.delete(key);},
 };
 return {storage,seed:(raw:string)=>data.set(KEY,raw),inspect:()=>data.get(KEY)??'未写入',clear:()=>data.clear()};
}
export function createChannelStore(storage:StateStorage) {
 return createStore<ChannelState>()(persist<ChannelState,[],[],Persisted>(
  (set)=>({
   tenant:'team-a',view:'list',enabledByTenant:{'team-a':true,'team-b':false},
   setTenant:tenant=>set({tenant}),
   setView:view=>set({view}),
   toggle:()=>set(state=>({enabledByTenant:{
    ...state.enabledByTenant,[state.tenant]:!state.enabledByTenant[state.tenant],
   }})),
  }),
  {
   name:KEY,version:2,storage:createJSONStorage<Persisted>(()=>storage),skipHydration:true,
   partialize:state=>({view:state.view,enabledByTenant:state.enabledByTenant}),
   migrate:(value,version)=>migrateChannelPreferences(value,version),
  }
 ));
}
export default function ZustandWorkshop({level}:{level:Level}){
 const [memory]=useState(makeMemoryStorage);
 const [store,setStore]=useState(()=>createChannelStore(memory.storage));
 const tenant=useStore(store,state=>state.tenant);
 const view=useStore(store,state=>state.view);
 const enabled=useStore(store,state=>state.enabledByTenant[state.tenant]);
 const tenantValues=useStore(store,state=>state.enabledByTenant);
 const [message,setMessage]=useState('');
 useEffect(()=>{void store.persist.rehydrate();},[store]);
 useEffect(()=>()=>memory.clear(),[memory]);
 async function reload(legacy=false) {
  if(legacy)memory.seed(JSON.stringify({state:{enabled:false,view:'grid'},version:1}));
  const next=createChannelStore(memory.storage);
  await next.persist.rehydrate();
  setStore(next);
  setMessage(legacy?'已执行 Zustand v1 → v2 migrate':'通过真实 persist 重新 hydrate，仅恢复白名单状态');
 }
 return <section aria-label="Zustand 状态隔离与迁移">
   <h2>{level==='basic'?'最小 vanilla store + React selector':level==='business'?'多租户频道状态与展示模式':'persist、partialize 和版本迁移'}</h2>
   <p>真实 Zustand createStore、useStore、persist；存储使用本 Demo 私有 Map，不写浏览器全局 localStorage。</p>
   {level!=='basic'&&<div className="demo-controls"><label>工作区
     <select aria-label="工作区" value={tenant} onChange={e=>store.getState().setTenant(e.target.value as Tenant)}>
       <option value="team-a">技术团队A</option><option value="team-b">商业团队B</option>
     </select></label><label>视图 <select aria-label="视图" value={view} onChange={e=>store.getState().setView(e.target.value as View)}>
       <option value="list">列表</option><option value="grid">网格</option></select></label></div>}
   <div className="demo-controls"><button type="button" onClick={()=>store.getState().toggle()}>切换当前频道启用状态</button>
     <button type="button" onClick={()=>void reload()}>模拟刷新 / 重新 hydrate</button>
     {level==='advanced'&&<button type="button" onClick={()=>void reload(true)}>导入旧版 v1 数据并迁移</button>}
   </div>
   <p role="status">{message}</p>
   <pre data-testid="zustand-state">{JSON.stringify({tenant,view,enabled,tenantValues},null,2)}</pre>
   {level==='advanced'&&<details><summary>查看实际序列化存储（不含函数和租户身份）</summary>
     <pre>{memory.inspect()}</pre></details>}
   <p>存储仅包含 view、enabledByTenant，tenant 与 action 不持久化；切换团队不能把前一团队启用标记泄露给后一团队。</p>
 </section>;
}
