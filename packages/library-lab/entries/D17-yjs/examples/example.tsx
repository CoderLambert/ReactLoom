import {useEffect, useRef, useState} from 'react';
import * as Y from 'yjs';

type Level = 'basic'|'business'|'advanced';
type Props = {level: Level};
type Replica = {left:Y.Doc;right:Y.Doc};
type View = {left:Record<string,unknown>;right:Record<string,unknown>; leftTitle:string;rightTitle:string};
const empty:View={left:{},right:{},leftTitle:'',rightTitle:''};
function inspect(pair:Replica):View {
 return {left:pair.left.getMap('feeds').toJSON(),right:pair.right.getMap('feeds').toJSON(),
  leftTitle:pair.left.getMap('meta').get('title') as string ?? '',
  rightTitle:pair.right.getMap('meta').get('title') as string ?? ''};
}
export function syncReplicas(left:Y.Doc,right:Y.Doc) {
 // Compute both deltas from the same pre-sync state vectors.
 const ab=Y.encodeStateAsUpdate(left,Y.encodeStateVector(right));
 const ba=Y.encodeStateAsUpdate(right,Y.encodeStateVector(left));
 Y.applyUpdate(right,ab,'demo-sync');
 Y.applyUpdate(left,ba,'demo-sync');
 return {bytesToRight:ab.byteLength,bytesToLeft:ba.byteLength};
}
export default function YjsExample({level}:Props) {
 const pair=useRef<Replica|null>(null);
 const nextId=useRef(0);
 const [view,setView]=useState<View>(empty);
 const [log,setLog]=useState('两份 Y.Doc 尚未交换任何二进制更新');
 useEffect(()=>{
  const local:Replica={left:new Y.Doc(),right:new Y.Doc()};
  pair.current=local;setView(inspect(local));
  return ()=>{if(pair.current===local)pair.current=null;local.left.destroy();local.right.destroy();};
 },[]);
 function change(which:'left'|'right') {
  const current=pair.current;if(!current)return;
  const id=++nextId.current;
  current[which].transact(()=>{
   current[which].getMap('feeds').set(which+'-'+id,{title:which==='left'?'前端实践':'国际新闻',updatedBy:which});
  },'demo-local');
  setView(inspect(current));setLog(which+' 离线写入，另一副本尚未更新');
 }
 function conflict(){
  const current=pair.current;if(!current)return;
  current.left.getMap('meta').set('title','A 的标题');
  current.right.getMap('meta').set('title','B 的标题');
  setView(inspect(current));setLog('两个副本在相同键上独立修改，胜出者不由本Demo预设');
 }
 function synchronize(){
  const current=pair.current;if(!current)return;
  const result=syncReplicas(current.left,current.right);
  setView(inspect(current));
  setLog('同步完成：A→B '+result.bytesToRight+' 字节；B→A '+result.bytesToLeft+' 字节');
 }
 return <section aria-label="Yjs 双副本 CRDT 真实演示">
  <h2>{level==='basic'?'Y.Map 和事务':level==='business'?'断网双端独立编辑及合并':'相同键并发冲突的收敛'}</h2>
  <p>下面是两份真实 Y.Doc，所有更改只发生在内存中；没有网络、持久化、意识广播或登录权限。</p>
  <div className="demo-controls">
   <button type="button" onClick={()=>change('left')}>A 添加 RSS</button>
   {level!=='basic'&&<button type="button" onClick={()=>change('right')}>B 离线添加</button>}
   {level==='advanced'&&<button type="button" onClick={conflict}>同时编辑 title</button>}
   {level!=='basic'&&<button type="button" onClick={synchronize}>交换增量并合并</button>}
  </div>
  <p role="status">{log}</p>
  <div className="demo-jobs">
   <div className="demo-output"><h3>副本 A</h3><pre data-testid="yjs-a">{JSON.stringify(view.left,null,2)}</pre>{level==='advanced'&&<p>标题：{view.leftTitle}</p>}</div>
   {level!=='basic'&&<div className="demo-output"><h3>副本 B</h3><pre data-testid="yjs-b">{JSON.stringify(view.right,null,2)}</pre>{level==='advanced'&&<p>标题：{view.rightTitle}</p>}</div>}
  </div>
  {level==='advanced'&&<p>只有两个副本交换 update 后才可能收敛；最终相同不意味着拥有业务语义上的“最新”标题。</p>}
 </section>;
}
