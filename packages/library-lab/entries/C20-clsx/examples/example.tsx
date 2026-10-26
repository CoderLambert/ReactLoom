import {useState} from 'react';
import clsx from 'clsx';
import {clsx as lite} from 'clsx/lite';

type Props={level:'basic'|'business'|'advanced'};
export default function ClassNamesExample({level}:Props){
 const [selected,setSelected]=useState(false);const [disabled,setDisabled]=useState(false);
 const [tone,setTone]=useState<'neutral'|'success'|'warning'>('neutral');
 const result=clsx('demo-card',{'is-selected':selected,'is-disabled':disabled},tone!=='neutral'&&`tone-${tone}`);
 const edge=clsx('px-2',false,null,undefined,0,1,['px-4',{active:true,inactive:false}]);
 return <section aria-label="clsx 实际运行示例">
  <h2>{level==='basic'?'条件类名':level==='business'?'新闻卡片状态':'易错输入与 Tailwind 冲突'}</h2>
  <div className="demo-controls"><label><input type="checkbox" checked={selected} onChange={e=>setSelected(e.target.checked)}/>选中</label><label><input type="checkbox" checked={disabled} onChange={e=>setDisabled(e.target.checked)}/>禁用操作</label>{level!=='basic'&&<label>提示语义<select value={tone} onChange={e=>setTone(e.target.value as typeof tone)}><option value="neutral">普通</option><option value="success">已归档</option><option value="warning">待审核</option></select></label>}</div>
  <article className={result}><h3>ReactLoom 每日工程精选</h3><p>真实 clsx 输出决定卡片状态类。语义状态必须同时通过原生属性表达。</p><button type="button" disabled={disabled} aria-pressed={selected} onClick={()=>setSelected(v=>!v)}>{selected?'取消收藏':'收藏文章'}</button></article>
  <p>实际返回的 className：</p><output data-testid="class-output" className="demo-output">{result}</output>
  {level==='advanced'&&<><h3>边界实测</h3><pre>{JSON.stringify({full:edge,lite:lite('base',selected&&'selected'),'truthy-number':clsx(1),'zero-ignored':clsx(0),'tailwind-not-merged':clsx('px-2','px-4')},null,2)}</pre><p>clsx 不判断 Tailwind 冲突，px-2 与 px-4 会同时保留；lite 只适合字符串条件组合。生产组件应对状态做有限枚举，不能把任意服务端字段用作类名。</p></>}
 </section>;
}
