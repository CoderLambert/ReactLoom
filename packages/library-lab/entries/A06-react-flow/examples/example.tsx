import {useCallback,useRef} from 'react';
import ReactFlow,{Background,Controls,MiniMap,addEdge,useNodesState,useEdgesState,type Node,type Edge,type Connection} from '@xyflow/react';
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
 const [nodes,setNodes,onNodesChange]=useNodesState<Node>(minimal?INIT_NODES.slice(0,2):INIT_NODES);
 const [edges,setEdges,onEdgesChange]=useEdgesState<Edge>(minimal?INIT_EDGES.slice(0,1):INIT_EDGES);
 const [message,setMessage]=useState('拖动节点，尝试连接两个节点的端点');
 const nextId=useRef(1);
 const onConnect=useCallback((connection:Connection)=>{
   if(connection.source===connection.target){setMessage('已阻止自身连接');return;}
   setEdges(old=>addEdge(connection,old));setMessage('已连接：'+connection.source+' → '+connection.target);
 },[setEdges]);
 function addNode(){
   const id='extra-'+nextId.current++;setNodes(old=>[...old,{id,position:{x:200+old.length*35,y:220+old.length*15},data:{label:'新增步骤 '+id}}]);
   setMessage('已添加节点 '+id);
 }
 function reset(){setNodes(minimal?INIT_NODES.slice(0,2):INIT_NODES);setEdges(minimal?INIT_EDGES.slice(0,1):INIT_EDGES);setMessage('已重置');nextId.current=1;}
 return <section aria-label="React Flow 工作流编辑器">
  <h2>{minimal?'最小节点连线':level==='business'?'新闻清洗流水线':'可变更工作流和非法连接'}</h2>
  <p>真实 @xyflow/react 受控节点/边；节点内文本不是可执行代码，示例不向后端提交执行命令。</p>
  {level==='advanced'&&<div className="demo-controls"><button type="button" onClick={addNode}>添加一个步骤</button><button type="button" onClick={reset}>重置</button></div>}
  <div style={{height:370,border:'1px solid #b5d2bf',borderRadius:10,background:'#f7faf7'}} aria-label="可拖放节点画布">
    <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
      onConnect={onConnect} fitView minZoom={0.2} maxZoom={2} nodesDraggable={true} nodesConnectable={true}>
      <Background/><Controls/>{level!=='basic'&&<MiniMap zoomable pannable/>}
    </ReactFlow>
  </div>
  <p role="status">{message}</p>
  <p>节点 {nodes.length}；连接 {edges.length}。业务权限、环路检查、边来源类型和服务端验证需由项目单独提供。</p>
  <table><caption>可访问的节点与连接清单</caption><thead><tr><th scope="col">节点</th><th scope="col">名称</th><th scope="col">下游</th></tr></thead>
  <tbody>{nodes.map(node=><tr key={node.id}><th scope="row">{node.id}</th><td>{String(node.data.label)}</td><td>{edges.filter(e=>e.source===node.id).map(e=>e.target).join(', ')||'—'}</td></tr>)}</tbody></table>
 </section>;
}
