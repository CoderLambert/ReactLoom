import {useEffect, useRef, useState} from 'react';
import {setup, createActor, assign, type ActorRefFrom} from 'xstate';

type Level = 'basic'|'business'|'advanced';
type Props = {level: Level};
type ReviewEvent =
  | {type:'SUBMIT'} | {type:'APPROVE'}
  | {type:'REJECT'; reason:string} | {type:'RETRY'} | {type:'RESET'};
type ReviewContext = {retries:number; reason:string};

export const reviewMachine = setup({
  types: {context: {} as ReviewContext, events: {} as ReviewEvent},
  guards: {hasRetryBudget: ({context}) => context.retries < 2},
  actions: {
    saveReason: assign({reason: ({event}) => event.type === 'REJECT' ? event.reason : ''}),
    incrementRetries: assign({retries: ({context}) => context.retries + 1, reason: ''}),
    clearReview: assign({retries: 0, reason: ''}),
  },
}).createMachine({
  id: 'rss-review',
  initial: 'draft',
  context: {retries: 0, reason: ''},
  states: {
    draft: {on: {SUBMIT: 'reviewing'}},
    reviewing: {on: {
      APPROVE: 'published',
      REJECT: {target: 'rejected', actions: 'saveReason'},
    }},
    rejected: {on: {
      RETRY: {target: 'reviewing', guard: 'hasRetryBudget', actions: 'incrementRetries'},
      RESET: {target: 'draft', actions: 'clearReview'},
    }},
    published: {on: {RESET: {target: 'draft', actions: 'clearReview'}}},
  },
});
type View = {state:string; retries:number; reason:string};
export default function XStateExample({level}: Props) {
  const actor = useRef<ActorRefFrom<typeof reviewMachine>|null>(null);
  const [view,setView] = useState<View>({state:'draft',retries:0,reason:''});
  const [reason,setReason] = useState('源站响应内容不完整');
  useEffect(()=>{
    const instance = createActor(reviewMachine);
    actor.current = instance;
    const subscription=instance.subscribe(snapshot=>setView({
      state:String(snapshot.value), retries:snapshot.context.retries, reason:snapshot.context.reason,
    }));
    instance.start();
    return ()=>{subscription.unsubscribe();instance.stop();if(actor.current===instance)actor.current=null;};
  },[]);
  const dispatch=(event:ReviewEvent)=>actor.current?.send(event);
  return <section aria-label="XState真实状态机演示">
    <h2>{level==='basic'?'显式状态转换':level==='business'?'RSS审稿业务状态机':'带重试预算的受保护转换'}</h2>
    <p>实际执行 XState v5 Actor，不使用散落的布尔变量模拟流程。任何事件只有在当前状态允许时才转换。</p>
    <div className="demo-output" data-testid="xstate-state">状态：{view.state}
      {level!=='basic'&&<p>最后拒绝原因：{view.reason||'无'}</p>}
      {level==='advanced'&&<p>已重试 {view.retries}/2；超过预算不会进入 reviewing。</p>}
    </div>
    <div className="demo-controls">
      <button type="button" disabled={view.state!=='draft'} onClick={()=>dispatch({type:'SUBMIT'})}>提交审核</button>
      <button type="button" disabled={view.state!=='reviewing'} onClick={()=>dispatch({type:'APPROVE'})}>批准发布</button>
      {level!=='basic'&&<>
        <label>拒绝原因<input value={reason} onChange={e=>setReason(e.target.value)} /></label>
        <button type="button" disabled={view.state!=='reviewing'||!reason.trim()}
          onClick={()=>dispatch({type:'REJECT',reason:reason.trim()})}>驳回</button>
        <button type="button" disabled={view.state!=='rejected'||view.retries>=2}
          onClick={()=>dispatch({type:'RETRY'})}>重试审核</button>
      </>}
      <button type="button" disabled={!['published','rejected'].includes(view.state)}
        onClick={()=>dispatch({type:'RESET'})}>重新开始</button>
    </div>
    <p>{level==='advanced'?'反复驳回并重试，验证 guard 阻止第三次重试。':
      '审批事件在 draft 状态没有转换，不需要为无效事件编写散落的 if/else。'}</p>
  </section>;
}
