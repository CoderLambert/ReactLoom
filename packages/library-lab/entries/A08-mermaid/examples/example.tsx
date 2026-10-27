import {useEffect,useMemo,useState} from 'react';
import mermaid from 'mermaid';
import {queueMermaidRender} from './render-queue';

type Level='basic'|'business'|'advanced';
let nextRenderId=0;
let initialized=false;
function prepareMermaid(){
  if(initialized)return;
  // Configuration is a trusted constant; never spread user/remote objects here.
  mermaid.initialize({startOnLoad:false,securityLevel:'strict',theme:'neutral',suppressErrorRendering:true});
  initialized=true;
}
const BASIC=[
  'flowchart LR',
  '  A[RSS源] --> B[正文抓取]',
  '  B --> C[文章索引]'
].join('\n');
const BUSINESS=[
  'sequenceDiagram',
  '  participant UI as 浏览器',
  '  participant API as NewsHub API',
  '  participant W as Worker',
  '  UI->>API: 请求新闻',
  '  API->>W: 获取已处理结果',
  '  W-->>API: 返回摘要',
  '  API-->>UI: 渲染列表'
].join('\n');
const ADVANCED=[
  'stateDiagram-v2',
  '  [*] --> Idle',
  '  Idle --> Loading: 开始',
  '  Loading --> Success: 成功',
  '  Loading --> Failed: 失败',
  '  Failed --> Loading: 重试',
  '  Success --> [*]'
].join('\n');

export default function MermaidExample({level}:{level:Level}){
  const [invalid,setInvalid]=useState(false);
  const [svg,setSvg]=useState('');
  const [error,setError]=useState('');
  const diagram=useMemo(()=>{
    if(level==='advanced'&&invalid)return 'stateDiagram-v2\n  ThisIsNot -->';
    return level==='basic'?BASIC:level==='business'?BUSINESS:ADVANCED;
  },[level,invalid]);

  useEffect(()=>{
    let active=true;
    setSvg('');
    setError('');
    // Mermaid mutates module-wide render state. Serialize even across concurrent
    // DemoHost instances; a stale queued job never invokes parse/render.
    void queueMermaidRender(
      () => active,
      async () => {
        prepareMermaid();
        const parsed=await mermaid.parse(diagram,{suppressErrors:true});
        if(!parsed)throw new Error('DSL 语法校验未通过');
        const result=await mermaid.render('rl-mermaid-'+(++nextRenderId),diagram);
        return result.svg;
      },
      result => setSvg(result),
      reason => setError('图形无法渲染：'+String(reason)),
    );
    return()=>{active=false;};
  },[diagram]);

  return <section aria-label="Mermaid 预设DSL图示">
    <h2>{level==='basic'?'可维护的流程图':level==='business'?'NewsHub 请求时序':'状态机 DSL 与错误恢复'}</h2>
    <p>来源仅为源码内定义的可信 DSL，不支持在本站提交任意脚本或用户配置对象。</p>
    {level==='advanced'&&<button type="button" onClick={()=>setInvalid(old=>!old)}>{invalid?'恢复合法状态图':'尝试无效语法'}</button>}
    <p role="status">{error||(!svg?'正在编译 Mermaid…':'Mermaid 图已生成')}</p>
    {svg&&!error&&<iframe
      title="沙箱 Mermaid SVG 预览"
      sandbox=""
      srcDoc={'<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#fff;}svg{max-width:100%;height:auto}</style></head><body>'+svg+'</body></html>'}
      style={{width:'100%',minHeight:280,border:'1px solid #d6e3d6',borderRadius:8,background:'#fff'}}
    />}
    <h3>可复制的 DSL 源</h3>
    <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}><code>{diagram}</code></pre>
    <p>无障碍说明：{level==='basic'?'RSS源进入抓取，再进入索引。':level==='business'?'浏览器请求API，API与Worker协作返回摘要。':'Idle发起Loading；Loading可到Success/Failed，失败可重试。'}</p>
    {level==='advanced'&&<p>无效示例只输出错误文本，旧图不会保留。iframe 没有 allow-scripts / allow-same-origin，生成 SVG 不能执行脚本。</p>}
  </section>;
}
