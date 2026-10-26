import {useRef,useState} from 'react';
import {AnimatePresence,motion,useReducedMotion} from 'motion/react';
type Level='basic'|'business'|'advanced';
type Item={id:string;text:string};
const INITIAL:Item[]=[{id:'rss',text:'RSS 订阅源'},{id:'model',text:'AI 模型设置'},{id:'notes',text:'技术阅读笔记'}];
export default function MotionMigrationExample({level}:{level:Level}){
  const reduced=Boolean(useReducedMotion());
  const [open,setOpen]=useState(true);
  const [items,setItems]=useState<Item[]>(INITIAL);
  const [undo,setUndo]=useState<Item[]|null>(null);
  const [selected,setSelected]=useState<string|null>(null);
  const nextId=useRef(0);
  function add(){nextId.current++;setUndo(items);setItems(old=>[...old,{id:'local-'+nextId.current,text:'新任务 '+nextId.current}]);}
  function remove(id:string){setUndo(items);setItems(old=>old.filter(x=>x.id!==id));if(selected===id)setSelected(null);}
  const transition=reduced?{duration:0}:{type:'spring' as const,stiffness:260,damping:25};
  return <section aria-label="react-motion现代迁移示例">
    <h2>{level==='basic'?'旧Motion.spring迁移':level==='business'?'TransitionMotion列表迁移':'动画退出、系统偏好和撤销'}</h2>
    <p>本页面实际运行维护中的 <code>motion/react</code>。旧 react-motion 仅作为迁移案例文档，不安装过时Runtime。</p>
    <button type="button" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>{open?'折叠卡片':'展开卡片'}</button>
    <AnimatePresence initial={false}>
      {open&&<motion.div key="details" initial={{opacity:0,y:reduced?0:-12}} animate={{opacity:1,y:0}}
        exit={{opacity:0,y:reduced?0:-12}} transition={transition}
        style={{border:'1px solid #bfd0c1',padding:16,borderRadius:8,margin:'12px 0'}}>
        从 react-motion 的数值插值迁到状态目标动画：业务只保存展开/折叠，动画由 Motion 管理。
      </motion.div>}
    </AnimatePresence>
    {level!=='basic'&&<>
      <div className="demo-controls"><button type="button" onClick={add}>添加任务</button>
        {level==='advanced'&&<button type="button" disabled={!undo} onClick={()=>{if(undo){setItems(undo);setUndo(null);}}}>撤销上一步</button>}</div>
      <ul style={{listStyle:'none',padding:0}}><AnimatePresence mode="popLayout">
        {items.map(item=><motion.li layout key={item.id} initial={{opacity:0,scale:reduced?1:0.93}}
          animate={{opacity:1,scale:1}} exit={{opacity:0,scale:reduced?1:0.93}}
          transition={transition} style={{display:'flex',gap:12,alignItems:'center',padding:10,marginBottom:8,border:'1px solid #d6ddd5',borderRadius:8}}>
          <button type="button" aria-pressed={selected===item.id} onClick={()=>setSelected(item.id)}>{item.text}</button>
          <button type="button" aria-label={'删除 '+item.text} onClick={()=>remove(item.id)}>删除</button>
        </motion.li>)}
      </AnimatePresence></ul>
    </>}
    <p role="status">选中：{items.find(x=>x.id===selected)?.text??'无'}；项目：{items.length}；减少动画：{reduced?'已启用':'未启用'}。</p>
    <p>旧版 TransitionMotion 的进入/离开生命周期由 AnimatePresence 负责，stable id 必须保持不变。</p>
  </section>;
}
