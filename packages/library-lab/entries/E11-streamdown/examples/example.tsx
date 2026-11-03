import {useEffect,useMemo,useState} from 'react';
import {Streamdown} from 'streamdown';

type Level='basic'|'business'|'advanced';
const scenarios:Record<Level,string>={
  basic:'# 流式标题\\n\\n逐步到来的 **Markdown** 段落；请观察尚未闭合的强调语法。',
  business:'# 新闻研究\\n\\n| 主题 | 条数 |\\n| --- | ---: |\\n| 前端工程 | 8 |\\n| AI 工具 | 5 |\\n\\n- [x] 已抓取\\n- [ ] 待复核',
  advanced:'# 安全边界\\n\\n```ts\\nconst preview = \"安全的代码文本\";\\n```\\n\\n<script>alert(1)</script>\\n\\n[不要打开](javascript:alert(1))\\n\\n**文字总能完整到达**',
};
export default function StreamingMarkdownExample({level}:{level:Level}){
 const text=useMemo(()=>scenarios[level].replaceAll('\\n','\n'),[level]);
 const chars=useMemo(()=>Array.from(text),[text]);
 const [visible,setVisible]=useState(0);
 const [playing,setPlaying]=useState(false);
 useEffect(()=>{setVisible(0);setPlaying(false);},[level]);
 useEffect(()=>{if(!playing)return;const timer=window.setInterval(()=>{
   setVisible(current=>Math.min(chars.length,current+4));
 },65);return()=>window.clearInterval(timer);},[playing,chars.length]);
 useEffect(()=>{if(visible>=chars.length)setPlaying(false);},[visible,chars.length]);
 return <section aria-label="Streamdown真实渲染实验">
  <h2>{level==='basic'?'不完整Markdown':level==='business'?'逐字到达的研究表格':'未闭合代码与恶意链接'}</h2>
  <p>本地文本模拟增量消息，渲染器确实使用 Streamdown；无模型调用。未启用 HTML 执行或任意自定义标签。</p>
  <div className="demo-controls">
   <button type="button" disabled={playing||visible>=chars.length} onClick={()=>setPlaying(true)}>{visible?'继续':'开始流式渲染'}</button>
   <button type="button" disabled={!playing} onClick={()=>setPlaying(false)}>暂停</button>
   <button type="button" onClick={()=>{setPlaying(false);setVisible(0)}}>重置</button>
  </div>
  <p role="status">接收 {visible} / {chars.length} 字符，{playing?'正在追加':'已暂停或结束'}</p>
  <div className="prose" style={{minHeight:180,padding:16,border:'1px solid #d8e0d4',borderRadius:8}}>
   <Streamdown isAnimating={playing}>{chars.slice(0,visible).join('')}</Streamdown>
  </div>
  {level==='advanced'&&<p>不可信内容必须审查 URL、HTML、插件和外部资源策略；这里只展示未授权脚本的字符串，不运行任意代码。</p>}
 </section>;
}
