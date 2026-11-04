import {useEffect,useRef,useState} from 'react';
import {axisBottom,axisLeft,curveMonotoneX,line,max,scaleBand,scaleLinear,select} from 'd3';
import {measuredWidth, visibleSelection, visibleSeries} from './chart-policy';
type Props={level:'basic'|'business'|'advanced'};
type Point={day:string;views:number;saves:number};
const FIXTURE:Point[]=[
  {day:'周一',views:48,saves:13},{day:'周二',views:73,saves:21},
  {day:'周三',views:64,saves:16},{day:'周四',views:96,saves:35},
  {day:'周五',views:87,saves:28},{day:'周六',views:112,saves:44},
  {day:'周日',views:103,saves:39},
];
export default function D3Workshop({level}:Props){
  const host=useRef<HTMLDivElement>(null);
  const svgRef=useRef<SVGSVGElement>(null);
  const [width,setWidth]=useState(620);
  const [days,setDays]=useState(7);
  const [minimum,setMinimum]=useState(0);
  const [selected,setSelected]=useState<string|null>(null);
  const points=FIXTURE.slice(-days);
  const visible=visibleSeries(FIXTURE,days,minimum);
  useEffect(()=>{
    const element=host.current;if(!element)return;
    const observer=new ResizeObserver(entries=>{
      const next=measuredWidth(entries[0]?.contentRect.width ?? 0);
      if(next!==null)setWidth(w=>w===next?w:next);
    });
    observer.observe(element);return()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    const element=svgRef.current;if(!element)return;
    const svg=select(element);svg.selectAll('*').interrupt().remove();
    const w=Math.max(240,width),h=280,m={top:24,right:24,bottom:46,left:47};
    svg.attr('viewBox','0 0 '+w+' '+h);
    const data=visible;
    const ticks=width<380?data.filter((_,index)=>index%2===0).map(item=>item.day):data.map(item=>item.day);
    const scaleX=scaleBand<string>().domain(data.map(d=>d.day)).range([m.left,w-m.right]).padding(.26);
    const ceiling=max(data,d=>d.views)??1;
    const scaleY=scaleLinear().domain([0,Math.max(10,ceiling*1.15)]).range([h-m.bottom,m.top]).nice();
    svg.append('g').attr('transform','translate(0,'+(h-m.bottom)+')')
      .call(axisBottom(scaleX).tickValues(ticks).tickSizeOuter(0));
    svg.append('g').attr('transform','translate('+m.left+',0)').call(axisLeft(scaleY).ticks(5));
    svg.append('text').attr('x',m.left).attr('y',15).attr('fill','currentColor')
      .attr('font-size','11').text('阅读数 / 收藏数');
    if(level==='basic'){
      svg.append('g').selectAll('rect').data(data).join('rect')
        .attr('x',d=>scaleX(d.day)??0).attr('width',scaleX.bandwidth())
        .attr('y',d=>scaleY(d.views)).attr('height',d=>scaleY(0)-scaleY(d.views))
        .attr('rx',3).attr('fill','#357761')
        .on('pointerenter',(_,d)=>setSelected(d.day));
    }else{
      const center=(d:Point)=>(scaleX(d.day)??0)+scaleX.bandwidth()/2;
      const viewsLine=line<Point>().x(center).y(d=>scaleY(d.views)).curve(curveMonotoneX);
      const savesLine=line<Point>().x(center).y(d=>scaleY(d.saves)).curve(curveMonotoneX);
      svg.append('path').datum(data).attr('d',viewsLine).attr('fill','none')
        .attr('stroke','#357761').attr('stroke-width',3);
      svg.append('path').datum(data).attr('d',savesLine).attr('fill','none')
        .attr('stroke','#ce8557').attr('stroke-width',2);
      svg.selectAll('circle').data(data).join('circle')
        .attr('cx',center).attr('cy',d=>scaleY(d.views)).attr('r',5)
        .attr('fill','#357761').style('cursor','pointer')
        .on('pointerenter',(_,d)=>setSelected(d.day));
    }
    return ()=>{svg.selectAll('*').interrupt().on('pointerenter',null).remove();};
  },[width,days,minimum,level]);
  const highlighted=visibleSelection(visible,selected);
  return <section aria-label="D3 可视化实战">
    <h2>{level==='basic'?'声明式数据，命令式绘制':level==='business'?'新闻阅读与收藏趋势':'数据窗口和阈值过滤'}</h2>
    <p>真实 D3 比例尺、轴与SVG数据联结；仅处理本组件SVG，不修改宿主页面DOM。</p>
    {level==='advanced'&&<div className="demo-controls">
      <label>日期窗口 <select value={days} onChange={e=>setDays(Number(e.target.value))}>
        <option value={3}>最近3天</option><option value={5}>最近5天</option><option value={7}>最近7天</option>
      </select></label>
      <label>阅读阈值 <input type="range" min="0" max="115" value={minimum}
        onChange={e=>setMinimum(Number(e.target.value))}/>{minimum}</label>
      <button type="button" onClick={()=>{setDays(7);setMinimum(0);setSelected(null);}}>恢复</button>
    </div>}
    <div ref={host} style={{width:'100%',minWidth:0}}>
      <svg ref={svgRef} role="img" aria-label="D3 新闻阅读数与收藏数趋势图" style={{width:'100%',height:'auto',color:'#384b40'}}/>
    </div>
    <p role="status">{highlighted?selected+'：阅读 '+highlighted.views+'，收藏 '+highlighted.saves:visible.length===0?'当前筛选没有可绘制的数据':selected?'原选中日期不在当前绘制结果中':'将指针移到图元上查看数据'}</p>
    <table><caption>可访问原始数据（含已过滤条目）</caption><thead><tr><th scope="col">日期</th><th scope="col">阅读</th><th scope="col">收藏</th></tr></thead>
      <tbody>{points.map(row=><tr key={row.day}><th scope="row">{row.day}</th><td>{row.views}</td><td>{row.saves}</td></tr>)}</tbody></table>
    <p>注意：指针高亮不等于屏幕阅读器可用；表格是等价数据出口。卸载时断开ResizeObserver并移除D3图元及事件。</p>
  </section>;
}
