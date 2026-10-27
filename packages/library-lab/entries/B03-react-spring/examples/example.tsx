import {animated,useSpring,useTransition} from '@react-spring/web';
import {useEffect,useRef,useState} from 'react';
import {appendUniqueArticle,MAX_SPRING_ARTICLES,focusDestinationAfterRemoval} from './article-policy';

type Level='basic'|'business'|'advanced';
type Article={id:string;title:string};
const seed:Article[]=[
  {id:'rss-1',title:'React 性能优化实践'},
  {id:'rss-2',title:'TypeScript 状态建模'}
];
function useLocalReducedMotion(){
  const [reduced,setReduced]=useState(()=>typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange=()=>setReduced(media.matches);
    onChange();
    media.addEventListener('change',onChange);
    return()=>media.removeEventListener('change',onChange);
  },[]);
  return reduced;
}

export default function SpringExample({level}:{level:Level}){
  const reduced=useLocalReducedMotion();
  const [expanded,setExpanded]=useState(true);
  const [articles,setArticles]=useState<Article[]>(seed);
  const nextId=useRef(3);
  const addRef=useRef<HTMLButtonElement|null>(null);
  const resetRef=useRef<HTMLButtonElement|null>(null);
  const style=useSpring({
    opacity:expanded?1:0.45,
    transform:expanded?'translateY(0px)':'translateY(18px)',
    immediate:reduced,
    config:{tension:240,friction:28}
  });
  const transitions=useTransition(articles,{
    keys:item=>item.id,
    from:{opacity:0,transform:'translateX(22px)'},
    enter:{opacity:1,transform:'translateX(0px)'},
    leave:{opacity:0,transform:'translateX(-22px)'},
    immediate:reduced,
    config:{tension:240,friction:28}
  });
  function addArticle(){
    if(articles.length>=MAX_SPRING_ARTICLES)return;
    const id=nextId.current++;
    setArticles(old=>appendUniqueArticle(old,{id:'rss-'+id,title:'新增订阅内容 #'+id}));
  }
  function removeArticle(id:string,button:HTMLButtonElement){
    const destination=focusDestinationAfterRemoval(document.activeElement===button,articles.length);
    setArticles(old=>old.filter(item=>item.id!==id));
    if(destination==='add')addRef.current?.focus();
    else if(destination==='reset')resetRef.current?.focus();
  }
  return <section aria-label="React Spring 实际动画实验">
    <h2>{level==='basic'?'弹簧卡片':level==='business'?'阅读列表进出场':'动画偏好与快速操作'}</h2>
    <p>真实调用 @react-spring/web。系统减少动态效果偏好：<strong>{reduced?'开启：立即跳到最终状态':'未开启：执行弹簧过渡'}</strong></p>
    <div className="demo-controls"><button type="button" onClick={()=>setExpanded(old=>!old)} aria-pressed={expanded}>{expanded?'收起视觉强调':'展开视觉强调'}</button></div>
    <animated.div style={{...style,background:'#e7f1e8',border:'1px solid #91b49d',borderRadius:12,padding:18}}>
      <strong>今日开发精选</strong><p>useSpring 将 React 状态映射到动画目标值，减少动画时由 immediate 控制。</p>
    </animated.div>
    {level!=='basic'&&<>
      <h3>动画列表 · stable keys</h3>
      <div className="demo-controls"><button ref={addRef} type="button" disabled={articles.length>=MAX_SPRING_ARTICLES} onClick={addArticle}>添加一条新闻（上限 {MAX_SPRING_ARTICLES}）</button><button ref={resetRef} type="button" onClick={()=>setArticles(seed)}>恢复默认数据</button></div>
      <div style={{display:'grid',gap:9}}>
        {transitions((animatedStyle,item)=><animated.article key={item.id} style={{...animatedStyle,background:'#fff',border:'1px solid #dbe4d9',borderRadius:8,padding:12,display:'flex',gap:12,justifyContent:'space-between',alignItems:'center'}}>
          <span>{item.title}</span><button type="button" onClick={event=>removeArticle(item.id,event.currentTarget)} aria-label={'移除 '+item.title}>移除</button>
        </animated.article>)}
      </div>
      <p role="status">逻辑上还存在 {articles.length} 条；离场动画元素随后卸载。</p>
    </>}
    {level==='advanced'&&<p>仅在被删除的按钮实际持有焦点时转移至“添加”按钮；列表 key 使用业务ID，动画配置只作用本演示，不写全局 Globals。</p>}
  </section>;
}
