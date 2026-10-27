import ExcelJS from 'exceljs';
import {checkRows,safeSpreadsheetText} from './row-policy.mjs';
export {safeSpreadsheetText} from './row-policy.mjs';

export const FIXTURE = Object.freeze([
  {id:'r01',source:'React Updates',reads:52,stars:5},
  {id:'r02',source:'Engineering Notes',reads:38,stars:8},
  {id:'r03',source:'Security Weekly',reads:25,stars:4},
]);

export async function generateWorkbook(level = 'basic', rows = FIXTURE) {
  if (!['basic','business','advanced'].includes(level)) throw new Error('unknown scenario');
  const totals = checkRows(rows);
  const book = new ExcelJS.Workbook();
  book.creator = 'ReactLoom Library Lab';
  book.created = new Date('2026-10-27T00:00:00Z');
  const sheet = book.addWorksheet('Sources', {views:[{state:'frozen',ySplit:1}]});
  sheet.columns = [
    {header:'Source ID',key:'id',width:18},
    {header:'Source',key:'name',width:32},
    {header:'Reads',key:'reads',width:15},
    {header:'Stars',key:'stars',width:15}
  ];
  sheet.getRow(1).font = {bold:true,color:{argb:'FFFFFFFF'}};
  sheet.getRow(1).fill = {type:'pattern',pattern:'solid',fgColor:{argb:'FF275B49'}};
  for (const row of rows) {
    sheet.addRow({id:safeSpreadsheetText(row.id),name:safeSpreadsheetText(row.source),reads:row.reads,stars:row.stars});
  }
  if (level !== 'basic') {
    const n = rows.length+2;
    sheet.getCell('B'+n).value='TOTAL';
    sheet.getCell('C'+n).value={formula:'SUM(C2:C'+(n-1)+')',result:totals.reads};
    sheet.getCell('D'+n).value={formula:'SUM(D2:D'+(n-1)+')',result:totals.stars};
    sheet.getRow(n).font={bold:true};
  }
  const bytes = await book.xlsx.writeBuffer();
  return {bytes,totals,sourceRows:rows.length};
}

export async function inspectWorkbook(bytes) {
  const input = new ExcelJS.Workbook();
  await input.xlsx.load(bytes);
  const sheet = input.getWorksheet('Sources');
  if (!sheet) throw new Error('Sources worksheet absent');
  return {
    rowCount:sheet.rowCount,
    firstSource:sheet.getCell('B2').value,
    summary:sheet.getCell('C'+sheet.rowCount).value,
    frozen:sheet.views[0]?.state==='frozen',
  };
}
