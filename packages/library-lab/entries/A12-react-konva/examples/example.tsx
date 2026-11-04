import { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text, Line, Group } from 'react-konva';
import {canAddNode, clampNodePosition, MAX_NODES, measuredStageWidth, newNodePosition, stageScale} from './stage-policy';

type Level = 'basic' | 'business' | 'advanced';
type Node = { id: string; title: string; x: number; y: number; fill: string };
const INITIAL: Node[] = [
  { id: 'collect', title: '采集 RSS', x: 28, y: 58, fill: '#cfe7d7' },
  { id: 'translate', title: '翻译', x: 220, y: 118, fill: '#e0e9fc' },
  { id: 'publish', title: '审核发布', x: 410, y: 45, fill: '#f5e6cf' },
];
function useStageWidth() {
  const host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1);
  useEffect(() => {
    const element = host.current; if (!element) return;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setWidth(measuredStageWidth(element.clientWidth)));
    });
    observer.observe(element);
    setWidth(measuredStageWidth(element.clientWidth));
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, []);
  return { host, width };
}
export default function ReactKonvaExample({ level }: { level: Level }) {
  const { host, width } = useStageWidth();
  const [nodes, setNodes] = useState<Node[]>(INITIAL);
  const nextNodeId = useRef(0);
  const [selected, setSelected] = useState('collect');
  const [locked, setLocked] = useState(false);
  useEffect(() => { setNodes(INITIAL); setSelected('collect'); setLocked(false); }, [level]);
  const scale = stageScale(width);
  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);
  const update = (id: string, patch: Partial<Node>) =>
    setNodes(old => old.map(n => n.id === id ? { ...n, ...patch } : n));
  const selectedNode = nodes.find(n => n.id === selected);
  return <section aria-label="react-konva 实际渲染">
    <h2>{level === 'basic' ? '声明式 Canvas 节点' : level === 'business' ? '数据流节点编排' : '增删、锁定与键盘操作'}</h2>
    <p>真实 react-konva Stage/Layer/Rect/Text：React管理稳定节点ID；Konva接收形状props并进行命中测试。</p>
    <div ref={host} style={{width:'100%',minWidth:0,border:'1px solid #ccd9d0',borderRadius:9,overflow:'hidden',background:'#fdfdf8'}}>
      <Stage width={width} height={Math.ceil(260 * scale)} scaleX={scale} scaleY={scale}>
        <Layer listening={false}>
          <Rect x={0} y={0} width={620} height={260} fill="#f9fcf7" />
          {nodes.slice(0,-1).map((n,i)=>{
            const next=nodeMap.get(nodes[i+1].id);
            return next?<Line key={`line-${n.id}`} points={[n.x+132,n.y+22,next.x,next.y+22]} stroke="#8da997" strokeWidth={2} dash={[6,3]}/>:null;
          })}
        </Layer>
        <Layer>
          {nodes.map(n => <Group key={n.id} x={n.x} y={n.y}
            draggable={level !== 'basic' && !locked}
            onClick={() => setSelected(n.id)} onTap={() => setSelected(n.id)}
            onDragMove={e => e.target.position(clampNodePosition(e.target.position()))}
            onDragEnd={e => { const next = clampNodePosition(e.target.position()); e.target.position(next); update(n.id, next); }}>
            <Rect width={132} height={52} fill={n.fill} cornerRadius={9}
              stroke={selected === n.id ? '#126d4e' : '#8ba49a'} strokeWidth={selected === n.id ? 3 : 1} />
            <Text x={9} y={16} width={115} height={24} text={n.title}
              fontSize={15} fill="#285647" listening={false} />
          </Group>)}
        </Layer>
      </Stage>
    </div>
    <div className="demo-controls">
      <label>选择节点 <select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">未选中</option>
        {nodes.map(n=><option key={n.id} value={n.id}>{n.title}</option>)}
      </select></label>
      {selectedNode && <button type="button" onClick={()=>update(selected,clampNodePosition({x:selectedNode.x+12,y:selectedNode.y}))}>键盘替代：右移12px</button>}
      {level === 'advanced' && <>
        <label><input type="checkbox" checked={locked} onChange={e=>setLocked(e.target.checked)}/> 锁定拖拽</label>
        <button type="button" disabled={!canAddNode(nodes.length)} onClick={()=>{
          if(!canAddNode(nodes.length))return;
          const id='step-'+(++nextNodeId.current);
          setNodes(old=>canAddNode(old.length)?[...old,{id,title:'步骤 '+(old.length+1),...newNodePosition(old.length),fill:'#eee6d8'}]:old);
          setSelected(id);
        }}>新增节点（上限 {MAX_NODES}）</button>
        <button type="button" onClick={()=>{if(selected){setNodes(old=>old.filter(n=>n.id!==selected));setSelected(nodes.find(n=>n.id!==selected)?.id??'');}}}>删除当前</button>
      </>}
    </div>
    <p role="status">节点 {nodes.length}，缩放 {scale.toFixed(2)}，宽度 {width}px，当前 {selectedNode?.title??'未选中'}。</p>
    <table><caption>Canvas 节点的可访问数据表</caption><thead><tr><th scope="col">节点</th><th scope="col">坐标</th><th scope="col">选择</th></tr></thead>
      <tbody>{nodes.map(n=><tr key={n.id}><td>{n.title}</td><td>({n.x},{n.y})</td><td><button type="button" onClick={()=>setSelected(n.id)}>选中</button></td></tr>)}</tbody></table>
    <p>仅canvas位置是屏幕呈现；真正业务操作仍必须提供 DOM 焦点和ARIA。</p>
  </section>;
}
