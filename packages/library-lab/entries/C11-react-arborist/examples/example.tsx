import {useRef,useState} from 'react';
import {Tree,adjustMoveIndex} from 'react-arborist';

type Props={level:'basic'|'business'|'advanced'};
type Item={id:string;name:string;children?:Item[]};
const starter:Item[]=[
 {id:'grp-tech',name:'技术',children:[{id:'feed-react',name:'React 官方博客'},{id:'feed-vite',name:'Vite 官方动态'}]},
 {id:'grp-business',name:'商业',children:[{id:'feed-product',name:'产品实践'}]},
 {id:'grp-reading',name:'个人收藏',children:[{id:'feed-notes',name:'深度阅读'}]},
];
function withoutIds(nodes:Item[],ids:Set<string>):{remaining:Item[];picked:Item[]} {
 const picked:Item[]=[];const remaining:Item[]=[];
 for(const item of nodes){
  if(ids.has(item.id)){picked.push(item);continue;}
  if(item.children){
   const nested=withoutIds(item.children,ids);
   picked.push(...nested.picked);
   remaining.push({...item,children:nested.remaining});
  }else remaining.push(item);
 }
 return {remaining,picked};
}
function locate(nodes:Item[],parentId:string|null):Item[]|null {
 if(parentId===null)return nodes;
 for(const item of nodes){
  if(item.id===parentId)return item.children??[];
  if(item.children){const children=locate(item.children,parentId);if(children!==null)return children;}
 }
 return null;
}
function insert(nodes:Item[],parentId:string|null,index:number,picked:Item[]):Item[]|null{
 if(parentId===null){const result=[...nodes];result.splice(Math.max(0,Math.min(index,result.length)),0,...picked);return result;}
 let inserted=false;
 const result=nodes.map(item=>{
  if(item.id===parentId){inserted=true;return {...item,children:insert(item.children??[],null,index,picked)??[]};}
  if(!item.children)return item;
  const nested=insert(item.children,parentId,index,picked);
  if(nested!==null){inserted=true;return {...item,children:nested};}
  return item;
 });
 return inserted?result:null;
}
export function moveTree(nodes:Item[],dragIds:string[],parentId:string|null,index:number):Item[]{
 if(!dragIds.length)return nodes;
 const siblings=locate(nodes,parentId);
 if(siblings===null)return nodes;
 const targetIndex=adjustMoveIndex({index,dragIds,siblingIds:siblings.map(item=>item.id)});
 const {remaining,picked}=withoutIds(nodes,new Set(dragIds));
 if(!picked.length)return nodes;
 // A move into a selected node's own subtree is invalid.
 return insert(remaining,parentId,targetIndex,picked)??nodes;
}
function renameTree(nodes:Item[],id:string,name:string):Item[]{
 return nodes.map(node=>node.id===id?{...node,name}:node.children?{...node,children:renameTree(node.children,id,name)}:node);
}
function stripTree(nodes:Item[],ids:Set<string>):Item[]{return withoutIds(nodes,ids).remaining;}
export default function ArboristWorkshop({level}:Props){
 const [nodes,setNodes]=useState<Item[]>(()=>level==='advanced'?[
  {...starter[0],children:[...(starter[0].children??[]),...Array.from({length:1800},(_,i)=>({id:'bulk-'+i,name:'技术源 '+(i+1)}))]},
  ...starter.slice(1),
 ]:structuredClone(starter));
 const [draft,setDraft]=useState('');
 const [search,setSearch]=useState('');
 const [selected,setSelected]=useState<string[]>([]);
 const composing=useRef(false);
 const count=(items:Item[]):number=>items.reduce((n,item)=>n+1+(item.children?count(item.children):0),0);
 return <section aria-label="react-arborist真实树控件">
  <h2>{level==='basic'?'节点展开与键盘选中':level==='business'?'受控RSS目录移动和重命名':'千级虚拟树与中文搜索'}</h2>
  <p>Tree 实际渲染、行复用和拖放由 react-arborist 管理；业务 ID 不随排序改变。</p>
  <div className="demo-controls">
   {level!=='basic'&&<label>搜索节点 <input aria-label="节点搜索" value={draft}
    onCompositionStart={()=>{composing.current=true;}}
    onCompositionEnd={e=>{composing.current=false;setSearch(e.currentTarget.value);}}
    onChange={e=>{setDraft(e.target.value);if(!composing.current)setSearch(e.target.value);}}/>
   </label>}
   <button type="button" onClick={()=>{setNodes(structuredClone(starter));setDraft('');setSearch('');setSelected([]);}}>恢复示例树</button>
  </div>
  <div style={{maxWidth:'100%',overflow:'auto',border:'1px solid #d5dcd1',borderRadius:8,padding:8}}>
   <Tree<Item>
    data={nodes} width={620} height={340} rowHeight={34} indent={22} overscanCount={3}
    searchTerm={search}
    searchMatch={(node,term)=>node.data.name.toLocaleLowerCase().includes(term.toLocaleLowerCase())}
    onMove={({dragIds,parentId,index})=>setNodes(previous=>moveTree(previous,dragIds,parentId,index))}
    onRename={({id,name})=>setNodes(previous=>renameTree(previous,id,name.trim()||'未命名'))}
    onDelete={({ids})=>setNodes(previous=>stripTree(previous,new Set(ids)))}
    onSelect={selectedNodes=>setSelected(selectedNodes.map(node=>node.id))}
   />
  </div>
  <p role="status">节点总数 {count(nodes)}；当前选择 {selected.join('、')||'无'}；匹配关键词 {search||'未筛选'}</p>
  <p>{level==='advanced'?'1800个节点仅用于虚拟化机制演示，不宣称性能数字；缩放和多选拖拽仍须真实浏览器测试。':'可尝试拖动节点到其他分组。onMove index 是删除前的槽位，本示例用 adjustMoveIndex 修正同级移动。'}</p>
 </section>;
}
