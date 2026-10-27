import {useCallback,useEffect,useRef,useState} from 'react';
import ReactFlow,{Background,Controls,MiniMap,addEdge,useNodesState,useEdgesState,type Node,type Edge,type Connection,type NodeChange} from '@xyflow/react';
import {validateConnection, pruneEdgesForRemovedNodes} from './graph-rules';
import {cloneWorkflowPreset} from './workflow-preset';
import '@xyflow/react/dist/style.css';
type Props={level:'basic'|'business'|'advanced'};
const INIT_NODES:Node[]=[
 {id:'source',type:'input',position:{x:60,y:100},data:{label:'订阅源输入'}},
 {id:'normalize',position:{x:300,y:100},data:{label:'清洗 / 去重'}},
 {id:'summary',position:{x:540,y:100},data:{label:'摘要生成'}},
 {id:'publish',type:'output',position:{x:780,y:100},data:{label:'输出文章'}},
];
const INIT_EDGES:Edge[]=[
 {id:'source-normalize',source:'source',target:'normalize'},
 {id:'normalize-summary',source:'normalize',target:'summary'},
 {id:'summary-publish',source:'summary',target:'publish'},
];
export default function ReactFlowWorkshop({level}:Props){
 const minimal=level==='basic';
 const initial=cloneWorkflowPreset(INIT_NODES,INIT_EDGES,level);
 const [nodes,setNodes,onNodesChange]=useNodesState<Node>(initial.nodes);
 const [edges,setEdges,onEdgesChange]=useEdgesState<Edge>(initial.edges);
 const [message,setMessage]=useState('拖动节点，尝试连接两个节点的端点');
 const [from,setFrom]=useState('source');
 const [to,setTo]=useState('normalize');
 const nextId=useRef(1);
 // DemoHost may keep the React component mounted across level changes.
 useEffect(()=>{
   const next=cloneWorkflowPreset(INIT_NODES,INIT_EDGES,level);
   setNodes(next.nodes);
   setEdges(next.edges);
   setFrom('source');setTo('normalize');
   nextId.current=1;
   setMessage('已按当前层级恢复工作流');
 },[level,setNodes,setEdges]);
 const handleNodesChange=useCallback((changes:NodeChange<Node>[])=>{
   onNodesChange(changes);
   const removed=new Set(changes.flatMap(change=>change.type==='remove'?[change.id]:[]));
   if(removed.size){
     setEdges(current=>pruneEdgesForRemovedNodes(current,removed));
     setMessage('已删除节点，关联连线已同步清理');
   }
 },[onNodesChange,setEdges]);
 const isValidConnection=useCallback((connection:Connection|Edge)=>
   validateConnection(nodes,edges,connection.source,connection.target).valid,[nodes,edges]);
 const onConnect=useCallback((connection:Connection)=>{
   const decision=validateConnection(nodes,edges,connection.source,connection.target);
   if(!decision.valid){
     const reasons={
       'missing-endpoint':'连接端点不完整','unknown-node':'目标节点不存在',
       'self-loop':'不可连接到自身','duplicate':'这条连线已存在',
       'cycle':'该连线会形成有向环路',
     };
     setMessage('已阻止连接：'+reasons[decision.reason]);return;
   }
   // Recheck against the queued edge state, not only the last render snapshot.
   setEdges(current=>validateConnection(nodes,current,connection.source,connection.target).valid
     ?addEdge(connection,current):current);
   setMessage('已连接：'+connection.source+' → '+connection.target);
 },[nodes,edges,setEdges]);
 function addNode(){
   const id='extra-'+nextId.current++;setNodes(old=>[...old,{id,position:{x:200+old.length*35,y:220+old.length*15},data:{label:'新增步骤 '+id}}]);
   setMessage('已添加节点 '+id);
 }
 function reset(){
   const next=cloneWorkflowPreset(INIT_NODES,INIT_EDGES,level);
   setNodes(next.nodes);setEdges(next.edges);
   setMessage('已重置');nextId.current=1;
   setFrom('source');setTo('normalize');
 }
 const validFrom=nodes.some(n=>n.id===from)?from:(nodes[0]?.id??'');
 const validTo=nodes.some(n=>n.id===to)?to:(nodes[1]?.id??'');
 const keyboardConnection=validateConnection(nodes,edges,validFrom,validTo);
 return <section aria-label="React Flow 工作流编辑器">
  <h2>{minimal?'最小节点连线':level==='business'?'新闻清洗流水线':'可变更工作流和非法连接'}</h2>
  <p>真实 @xyflow/react 受控节点/边；节点内文本不是可执行代码，示例不向后端提交执行命令。</p>
  {level==='advanced'&&<>
    <div className="demo-controls"><button type="button" onClick={addNode}>添加一个步骤</button><button type="button" onClick={reset}>重置</button></div>
    <fieldset><legend>通过键盘连接节点（与画布共用 DAG 校验）</legend>
      <label>起点 <select value={validFrom} onChange={event=>setFrom(event.target.value)}>
        {nodes.map(node=><option key={node.id} value={node.id}>{String(node.data.label)}</option>)}
      </select></label>
      <label>终点 <select value={validTo} onChange={event=>setTo(event.target.value)}>
        {nodes.map(node=><option key={node.id} value={node.id}>{String(node.data.label)}</option>)}
      </select></label>
      <button type="button" disabled={!keyboardConnection.valid} onClick={()=>
        onConnect({source:validFrom,target:validTo,sourceHandle:null,targetHandle:null})}>建立连接</button>
      {!keyboardConnection.valid&&<span> 当前连接不可用：{keyboardConnection.reason}</span>}
    </fieldset>
  </>}
  <div style={{height:370,border:'1px solid #b5d2bf',borderRadius:10,background:'#f7faf7'}} aria-label="可拖放节点画布">
    <ReactFlow nodes={nodes} edges={edges} onNodesChange={handleNodesChange} onEdgesChange={onEdgesChange}
      onConnect={onConnect} isValidConnection={isValidConnection} fitView minZoom={0.2} maxZoom={2} nodesDraggable={true} nodesConnectable={true}>
      <Background/><Controls/>{level!=='basic'&&<MiniMap zoomable pannable/>}
    </ReactFlow>
  </div>
  <p role="status">{message}</p>
  <p>节点 {nodes.length}；连接 {edges.length}。本地拒绝自身连接、重复、有向环路与失效端点，删除节点同步清理相关边；节点类型、权限和服务端发布验证仍需由项目提供。</p>
  <table><caption>可访问的节点与连接清单</caption><thead><tr><th scope="col">节点</th><th scope="col">名称</th><th scope="col">下游</th></tr></thead>
  <tbody>{nodes.map(node=><tr key={node.id}><th scope="row">{node.id}</th><td>{String(node.data.label)}</td><td>{edges.filter(e=>e.source===node.id).map(e=>e.target).join(', ')||'—'}
    {level==='advanced'&&<button type="button" style={{marginLeft:8}}
      disabled={node.id==='source'||node.id==='publish'}
      onClick={()=>handleNodesChange([{id:node.id,type:'remove'}])}
      aria-label={'删除节点 '+String(node.data.label)}>删除节点</button>}</td></tr>)}</tbody></table>
 </section>;
}
