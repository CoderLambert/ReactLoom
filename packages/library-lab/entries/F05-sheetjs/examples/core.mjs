import * as XLSX from 'xlsx';
import {MAX_ROWS, HEADERS, normalize} from './validation.mjs';
import {preflightXlsx} from './archive-policy.mjs';
export {normalize} from './validation.mjs';
export const fixture=[
 {channel:'Frontend',views:128,kind:'订阅'}, {channel:'AI',views:63,kind:'推荐'},
 {channel:'DevOps',views:32,kind:'专题'},
];
export function createWorkbook(rows=fixture){
 const clean=normalize(rows);const sheet=XLSX.utils.json_to_sheet(clean,{header:HEADERS});
 sheet['!cols']=[{wch:30},{wch:15},{wch:16}];const book=XLSX.utils.book_new();
 XLSX.utils.book_append_sheet(book,sheet,'Subscriptions');
 return book;
}
export function exportWorkbook(rows){return XLSX.write(createWorkbook(rows),{bookType:'xlsx',type:'buffer',compression:true});}
export function importWorkbook(bytes){
 if(!(bytes instanceof Uint8Array) || bytes.byteLength<1 || bytes.byteLength>2_000_000) {
   throw new Error('仅接受不超过2MiB的工作簿字节');
 }
 // Check declared ZIP expansion before XML parsing. Not a substitute for a bounded parser.
 preflightXlsx(bytes);
 // sheetRows bounds materialization; !fullref preserves a bigger source range for rejection.
 const book=XLSX.read(bytes,{cellFormula:true,cellHTML:false,cellText:false,sheetRows:MAX_ROWS+2});
 if(book.SheetNames.length!==1)throw new Error('仅接受单个工作表');
 const sheet=book.Sheets[book.SheetNames[0]];
 const ref=sheet['!fullref']||sheet['!ref'];
 if(!ref)throw new Error('工作表为空');
 const range=XLSX.utils.decode_range(ref);
 if(range.s.r!==0 || range.s.c!==0 || range.e.c!==2 || range.e.r>MAX_ROWS) {
   throw new Error('工作表必须从A1开始，仅有三列且不超过200行数据');
 }
 for(const [address,cell] of Object.entries(sheet)){
   if(address.startsWith('!'))continue;
   if(cell && typeof cell==='object' && ('f' in cell || 'F' in cell)) {
     throw new Error('本导入器不接受公式单元格');
   }
 }
 const matrix=XLSX.utils.sheet_to_json(sheet,{header:1,raw:true,defval:null,blankrows:false});
 const header=matrix.shift();
 if(!Array.isArray(header) || header.length!==3 || header.some((v,i)=>v!==HEADERS[i])) {
   throw new Error('工作表表头必须精确匹配 channel、views、kind');
 }
 return normalize(matrix.map(row=>{
   if(!Array.isArray(row)||row.length!==3)throw new Error('每行必须恰好三列');
   return {channel:row[0],views:row[1],kind:row[2]};
 }));
}
