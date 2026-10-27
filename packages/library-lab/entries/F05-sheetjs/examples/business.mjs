import {exportWorkbook,importWorkbook} from './core.mjs';
const rows=[{channel:'NewsHub 国际新闻',views:600,kind:'RSS'},{channel:'技术专栏',views:250,kind:'推荐'}];
const bytes=exportWorkbook(rows);const restored=importWorkbook(bytes);
if(restored.reduce((n,r)=>n+r.views,0)!==850)throw new Error('汇总不正确');
console.log(JSON.stringify({rows:restored,count:restored.length,totalViews:850,bytes:bytes.length},null,2));
