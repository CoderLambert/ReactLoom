import * as XLSX from 'xlsx';
const MAX_ROWS=200;
export const fixture=[
 {channel:'Frontend',views:128,kind:'订阅'}, {channel:'AI',views:63,kind:'推荐'},
 {channel:'DevOps',views:32,kind:'专题'},
];
function text(value){
 const s=String(value).trim();
 if(!s||s.length>120)throw new Error('文本长度或内容无效');
 return /^[=+\-@\t\r]/u.test(s)?"'"+s:s;
}
export function normalize(rows){
 if(!Array.isArray(rows)||rows.length<1||rows.length>MAX_ROWS)throw new Error('超出允许的行数');
 const names=new Set();
 return rows.map(row=>{
  const channel=text(row.channel);
  if(names.has(channel))throw new Error('重复的订阅频道');
  names.add(channel);
  if(!Number.isSafeInteger(row.views)||row.views<0)throw new Error('计数必须是非负整数');
  return {channel,views:row.views,kind:text(row.kind)};
 });
}
export function createWorkbook(rows=fixture){
 const clean=normalize(rows);const sheet=XLSX.utils.json_to_sheet(clean,{header:['channel','views','kind']});
 sheet['!cols']=[{wch:30},{wch:15},{wch:16}];const book=XLSX.utils.book_new();
 XLSX.utils.book_append_sheet(book,sheet,'Subscriptions');
 return book;
}
export function exportWorkbook(rows){return XLSX.write(createWorkbook(rows),{bookType:'xlsx',type:'buffer',compression:true});}
export function importWorkbook(bytes){
 if(!bytes || bytes.byteLength>2_000_000)throw new Error('拒绝处理超过2MiB的未知表格');
 const book=XLSX.read(bytes,{type:'buffer',cellFormula:false,cellHTML:false,cellText:false});
 if(book.SheetNames.length!==1)throw new Error('仅接受单个工作表');
 const rows=XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]],{defval:'',raw:true});
 return normalize(rows);
}
