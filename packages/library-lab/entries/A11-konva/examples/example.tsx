import { useEffect, useRef, useState } from 'react';
import Konva from 'konva';

type Level = 'basic' | 'business' | 'advanced';
type Card = { id: string; title: string; x: number; y: number; width: number; height: number; color: string };
const initial: Card[] = [
  { id: 'rss', title: 'RSS 收集', x: 25, y: 35, width: 150, height: 68, color: '#e4eee5' },
  { id: 'review', title: '内容审核', x: 225, y: 145, width: 150, height: 68, color: '#eaf0fa' },
];
type CanvasNode = { group: Konva.Group; rect: Konva.Rect; label: Konva.Text };
export default function KonvaExample({ level }: { level: Level }) {
  const host = useRef<HTMLDivElement>(null);
  const stage = useRef<Konva.Stage | null>(null);
  const layer = useRef<Konva.Layer | null>(null);
  const transformer = useRef<Konva.Transformer | null>(null);
  const nodes = useRef<Map<string, CanvasNode>>(new Map());
  const [cards, setCards] = useState<Card[]>(initial);
  const [selected, setSelected] = useState<string | null>('rss');
  const [ready, setReady] = useState(false);
  const nextCardId = useRef(0);
  const [zoom, setZoom] = useState(1);
  const apply = (id: string, patch: Partial<Card>) =>
    setCards(old => old.map(c => c.id === id ? { ...c, ...patch } : c));
  useEffect(() => { setCards(initial); setSelected('rss'); setZoom(1); }, [level]);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const scene = new Konva.Stage({ container: el, width: Math.max(320, el.clientWidth), height: 280 });
    const canvasLayer = new Konva.Layer();
    const handles = new Konva.Transformer({
      rotateEnabled: false, flipEnabled: false, keepRatio: false,
      boundBoxFunc: (oldBox, next) => Math.abs(next.width) < 85 || Math.abs(next.height) < 48 ? oldBox : next,
    });
    canvasLayer.add(handles); scene.add(canvasLayer);
    stage.current = scene; layer.current = canvasLayer; transformer.current = handles;
    setReady(true);
    const onWheel = (event: Konva.KonvaEventObject<WheelEvent>) => {
      if (level !== 'advanced') return;
      event.evt.preventDefault();
      const pointer = scene.getPointerPosition();
      if (!pointer) return;
      const before = scene.scaleX();
      const after = Math.max(.6, Math.min(2, before * (event.evt.deltaY > 0 ? .9 : 1.1)));
      const world = { x: (pointer.x - scene.x()) / before, y: (pointer.y - scene.y()) / before };
      scene.scale({ x: after, y: after });
      scene.position({ x: pointer.x - world.x * after, y: pointer.y - world.y * after });
      setZoom(after);
    };
    scene.on('wheel', onWheel);
    let raf = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { if (stage.current === scene) scene.width(Math.max(320, el.clientWidth)); });
    });
    observer.observe(el);
    return () => {
      observer.disconnect(); cancelAnimationFrame(raf);
      scene.off('wheel', onWheel); scene.destroy();
      stage.current = null; layer.current = null; transformer.current = null; nodes.current.clear();
    };
  }, [level]);
  useEffect(() => {
    if (!ready || !layer.current || !transformer.current) return;
    const current = nodes.current;
    const wanted = new Set(cards.map(c => c.id));
    for (const [id, node] of current) if (!wanted.has(id)) { node.group.destroy(); current.delete(id); }
    for (const card of cards) {
      let node = current.get(card.id);
      if (!node) {
        const group = new Konva.Group({ id: card.id, x: card.x, y: card.y, draggable: level !== 'basic' });
        const rect = new Konva.Rect({ width: card.width, height: card.height, fill: card.color, cornerRadius: 9 });
        const label = new Konva.Text({ x: 10, y: 21, text: card.title, width: card.width - 20, fill: '#244c3b', fontSize: 16 });
        group.add(rect, label); layer.current.add(group);
        group.on('click tap', () => setSelected(card.id));
        group.on('dragend', () => apply(card.id, { x: Math.round(group.x()), y: Math.round(group.y()) }));
        group.on('transformend', () => {
          const width = Math.max(85, Math.round(rect.width() * group.scaleX()));
          const height = Math.max(48, Math.round(rect.height() * group.scaleY()));
          group.scale({ x: 1, y: 1 });
          apply(card.id, { width, height, x: Math.round(group.x()), y: Math.round(group.y()) });
        });
        node = { group, rect, label }; current.set(card.id, node);
      }
      if (!node.group.isDragging()) node.group.position({ x: card.x, y: card.y });
      node.rect.size({ width: card.width, height: card.height });
      node.label.setAttrs({ text: card.title, width: card.width - 20 });
    }
    const selectedNode = selected ? current.get(selected)?.group : null;
    transformer.current.nodes(level === 'advanced' && selectedNode ? [selectedNode] : []);
    transformer.current.moveToTop();
    layer.current.batchDraw();
  }, [cards, selected, ready, level]);
  const chosen = cards.find(c => c.id === selected);
  return <section aria-label="Konva 原生 Canvas 场景">
    <h2>{level === 'basic' ? '场景图节点与选择' : level === 'business' ? '审核流可拖拽卡片' : '变换、缩放、操作替代'}</h2>
    <p>真实 Konva Stage/Layer/Group/Rect/Text，舞台挂载一次并增量同步；鼠标拖拽后才写入业务坐标。</p>
    <div ref={host} style={{ width: '100%', minWidth: 320, minHeight: 280, border: '1px solid #ccd9ca', borderRadius: 8, background: '#fafcf7' }}
      role="img" aria-label="新闻工作流的可拖拽 Canvas；下方提供键盘操作与等价卡片列表" />
    <div className="demo-controls">
      <label>当前选中<select value={selected ?? ''} onChange={e => setSelected(e.target.value || null)}>
        <option value="">未选中</option>{cards.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
      </select></label>
      {chosen && <><button type="button" onClick={() => apply(chosen.id, { x: chosen.x + 10 })}>向右 10px</button>
        <button type="button" onClick={() => apply(chosen.id, { y: chosen.y + 10 })}>向下 10px</button></>}
      {level === 'advanced' && <>
        <button type="button" onClick={() => setCards(old => [...old, { id: `node-${++nextCardId.current}`, title: `步骤 ${old.length + 1}`, x: 40 + old.length * 35, y: 75 + old.length * 15, width: 135, height: 60, color: '#f2e5d1' }])}>新增卡片</button>
        <button type="button" onClick={() => { if (selected) { setCards(old => old.filter(c => c.id !== selected)); setSelected(null); } }} disabled={!chosen}>删除选中</button>
        <button type="button" onClick={() => { stage.current?.scale({ x: 1, y: 1 }); stage.current?.position({ x: 0, y: 0 }); setZoom(1); }}>还原缩放</button>
      </>}
    </div>
    <p role="status">节点 {cards.length}，当前缩放 {zoom.toFixed(2)}，选中 {chosen?.title ?? '无'}。缩放需要将指针坐标映射到世界坐标。</p>
    <ul>{cards.map(c => <li key={c.id}>{c.title} · x={c.x}, y={c.y}, {c.width}×{c.height} <button type="button" onClick={() => setSelected(c.id)}>选择</button></li>)}</ul>
    {level === 'advanced' && <p>Transformer resize 后要将 group.scale 合并进 width/height，再将scale重置；舞台销毁必须销毁全部图元和监听。</p>}
  </section>;
}
