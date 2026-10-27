import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {configureStore,createSlice,type PayloadAction} from '@reduxjs/toolkit';

type Level='basic'|'business'|'advanced';
type Props={level:Level};
type Feed={id:string;title:string;read:boolean};
type State={counter:number;feeds:Feed[];activeRequest:string|null;result:string;ignored:number};

export const feedsSlice=createSlice({
 name:'labFeeds',
 initialState:{counter:0,feeds:[],activeRequest:null,result:'',ignored:0} as State,
 reducers:{
  increment(state){state.counter+=1;},
  addFeed(state,action:PayloadAction<Feed>){
   if(!state.feeds.some(feed=>feed.id===action.payload.id))state.feeds.push(action.payload);
  },
  toggleRead(state,action:PayloadAction<string>){
   const feed=state.feeds.find(item=>item.id===action.payload);
   if(feed)feed.read=!feed.read;
  },
  startRequest(state,action:PayloadAction<string>){state.activeRequest=action.payload;},
  cancelRequest(state){state.activeRequest=null;},
  finishRequest(state,action:PayloadAction<{id:string;value:string}>){
   if(state.activeRequest!==action.payload.id){state.ignored++;return;}
   state.result=action.payload.value;state.activeRequest=null;
  },
  reset(){return{counter:0,feeds:[],activeRequest:null,result:'',ignored:0} as State;},
 },
});
export const actions=feedsSlice.actions;
export function createFeedStore(){return configureStore({reducer:{feeds:feedsSlice.reducer},devTools:false});}

export default function ReduxExample({level}:Props){
 const [stores]=useState(()=>({A:createFeedStore(),B:createFeedStore()}));
 const [tenant,setTenant]=useState<'A'|'B'>('A');
 const active=stores[tenant];
 const state=useSyncExternalStore(active.subscribe,active.getState,active.getState).feeds;
 const seq=useRef(0);
 const timers=useRef<ReturnType<typeof setTimeout>[]>([]);
 useEffect(()=>()=>{for(const timer of timers.current)clearTimeout(timer);timers.current=[];active.dispatch(actions.cancelRequest());},[active]);
 function add(){
  const id=tenant+'-'+(++seq.current);
  active.dispatch(actions.addFeed({id,title:'新闻源 '+id,read:false}));
 }
 function demonstrateRace(){
  timers.current.forEach(clearTimeout);timers.current=[];
  const first='old-'+(++seq.current),latest='new-'+(++seq.current);
  active.dispatch(actions.startRequest(first));
  active.dispatch(actions.startRequest(latest));
  timers.current.push(setTimeout(()=>active.dispatch(actions.finishRequest({id:latest,value:'新请求已采用'})),90));
  timers.current.push(setTimeout(()=>active.dispatch(actions.finishRequest({id:first,value:'旧请求不该覆盖'})),200));
 }
 return <section aria-label="Redux Toolkit真实store演示">
  <h2>{level==='basic'?'createSlice 与不可变更新':level==='business'?'租户独立 store 与动态条目':'请求身份与过期响应防护'}</h2>
  {level!=='basic'&&<label>当前工作区 <select value={tenant} onChange={event=>setTenant(event.target.value as 'A'|'B')}>
    <option value="A">团队 A</option><option value="B">团队 B</option>
  </select></label>}
  <div className="demo-controls">
   <button type="button" onClick={()=>active.dispatch(actions.increment())}>计数 +1</button>
   {level!=='basic'&&<button type="button" onClick={add}>增加频道</button>}
   {level==='advanced'&&<button type="button" onClick={demonstrateRace}>模拟先后返回的两个请求</button>}
   <button type="button" onClick={()=>active.dispatch(actions.reset())}>只重置当前工作区</button>
  </div>
  <output className="demo-output" data-testid="redux-state">当前 {tenant} 计数 {state.counter}
   {level!=='basic'&&<ul>{state.feeds.map(feed=><li key={feed.id}><label>
    <input type="checkbox" checked={feed.read} onChange={()=>active.dispatch(actions.toggleRead(feed.id))}/>
    {feed.title}</label></li>)}</ul>}
   {level==='advanced'&&<p>最后结果：{state.result||'待运行'}；已忽略过期响应：{state.ignored}；活跃请求：{state.activeRequest||'无'}</p>}
  </output>
  <p>演示真实 Redux Toolkit reducer/store；React 订阅使用原生 useSyncExternalStore。正式多组件应用可选择 react-redux，不需要将 Lab Demo 包装方式强制移植。</p>
 </section>;
}
