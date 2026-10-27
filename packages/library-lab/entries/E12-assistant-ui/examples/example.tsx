import {useMemo} from 'react';
import {
 AssistantRuntimeProvider,ComposerPrimitive,MessagePrimitive,
 ThreadPrimitive,useLocalRuntime,type ChatModelAdapter,
} from '@assistant-ui/react';

type Level='basic'|'business'|'advanced';
function sleep(ms:number,signal:AbortSignal){return new Promise<void>((resolve,reject)=>{
 if(signal.aborted){reject(new DOMException('cancelled','AbortError'));return}
 const timer=window.setTimeout(()=>{signal.removeEventListener('abort',abort);resolve()},ms);
 const abort=()=>{clearTimeout(timer);signal.removeEventListener('abort',abort);reject(new DOMException('cancelled','AbortError'))};
 signal.addEventListener('abort',abort,{once:true});
});}
function LocalPlayground({level}:{level:Level}){
 const adapter=useMemo<ChatModelAdapter>(()=>({
  async *run({messages,abortSignal}){
   const output=level==='basic'?'这是本地适配器的确定性回复，不访问任何模型。':
    level==='business'?'新闻研究任务：先去重 RSS，再记录来源和抓取时间；不把 Mock 数据当真实新闻。':
    '边界实验：运行中可点击停止，取消信号由 runtime 传给适配器；不要在组件卸载后继续向旧线程推送。';
   const segments=level==='basic'?[output]:[output.slice(0,20),output.slice(0,50),output];
   for(const part of segments){
    if(abortSignal.aborted) return;
    try{await sleep(level==='advanced'?450:220,abortSignal)}catch{ return; }
    if(abortSignal.aborted)return;
    yield {content:[{type:'text',text:part}]};
   }
  },
 }),[level]);
 const runtime=useLocalRuntime(adapter);
 return <AssistantRuntimeProvider runtime={runtime}>
  <ThreadPrimitive.Root style={{border:'1px solid #dce2dc',borderRadius:10,padding:14}}>
   <ThreadPrimitive.Viewport style={{minHeight:240,maxHeight:310,overflowY:'auto',display:'flex',flexDirection:'column',gap:9}}>
    <ThreadPrimitive.Messages>{({message})=><MessagePrimitive.Root style={{padding:10,borderRadius:8,background:message.role==='user'?'#edf3e8':'#f4f4f1'}}>
     <strong>{message.role==='user'?'用户':'本地适配器'}</strong><div><MessagePrimitive.Parts/></div>
    </MessagePrimitive.Root>}</ThreadPrimitive.Messages>
   </ThreadPrimitive.Viewport>
   <ComposerPrimitive.Root style={{display:'flex',gap:9,marginTop:12}}>
    <ComposerPrimitive.Input aria-label="向本地适配器提问" placeholder="输入内容后发送，数据不会离开浏览器…" style={{flex:1,minHeight:70}}/>
    <div style={{display:'flex',flexDirection:'column',gap:5}}><ComposerPrimitive.Send>发送</ComposerPrimitive.Send>
     {level==='advanced'&&<ComposerPrimitive.Cancel>停止响应</ComposerPrimitive.Cancel>}
    </div>
   </ComposerPrimitive.Root>
  </ThreadPrimitive.Root>
 </AssistantRuntimeProvider>;
}
export default function AssistantUiExample({level}:{level:Level}){
 return <section aria-label="assistant-ui真实运行时实验"><h2>{level==='basic'?'聊天状态与组件原语':level==='business'?'本地新闻研究提示':'流式输出与取消'}</h2>
 <p>真正使用 useLocalRuntime、AssistantRuntimeProvider 与 UI primitives；ChatModelAdapter 是明确声明的本地 fixture，完全不访问AI模型或云端API。</p>
 <LocalPlayground key={level} level={level}/></section>;
}
