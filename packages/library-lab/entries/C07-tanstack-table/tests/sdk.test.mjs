import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {
  createColumnHelper,createPaginatedRowModel,createSortedRowModel,
  rowPaginationFeature,rowSelectionFeature,rowSortingFeature,
  sortFn_text,tableFeatures,useTable,
} from '@tanstack/react-table';

// Deliberately imports the actual v9 adapter. Do not substitute a table-shaped mock.
const features=tableFeatures({
  rowSortingFeature,rowPaginationFeature,rowSelectionFeature,
  sortedRowModel:createSortedRowModel(),
  paginatedRowModel:createPaginatedRowModel(),
  sortFns:{text:sortFn_text},
});
const helper=createColumnHelper();
const columns=helper.columns([
  helper.accessor('title',{header:'标题',sortFn:'text'}),
  helper.accessor('id',{header:'稳定ID',enableSorting:false}),
]);
const seeds=[{id:'feed-z',title:'Zed'},{id:'feed-a',title:'Alpha'},{id:'feed-b',title:'Beta'}];
function snapshot(options){
  let observed;
  function Probe(){
    const table=useTable({
      features,columns,data:options.rows??seeds,getRowId:row=>row.id,
      manualPagination:Boolean(options.manual),manualSorting:Boolean(options.manual),
      rowCount:options.manual?5:undefined,
      state:{
        sorting:options.sorting??[],
        pagination:{pageIndex:options.pageIndex??0,pageSize:options.pageSize??2},
        rowSelection:options.selection??{},
      },
    });
    observed={
      ids:table.getRowModel().rows.map(row=>row.id),
      pageCount:table.getPageCount(),
      selectedInData:table.getSelectedRowModel().rows.map(row=>row.id),
      selectedOnPage:table.getRowModel().rows.filter(row=>row.getIsSelected()).map(row=>row.id),
      selectedIds:table.getSelectedRowIds(),
      canNextPage:table.getCanNextPage(),
    };
    return createElement('p',null,observed.ids.join(','));
  }
  renderToStaticMarkup(createElement(Probe));
  return observed;
}
test('real v9 client table sorts before pagination and keeps business IDs',()=>{
  const options={sorting:[{id:'title',desc:false}],pageSize:1,selection:{'feed-z':true}};
  const result=snapshot(options);
  assert.deepEqual(result.ids,['feed-a']);
  assert.deepEqual(result.selectedIds,['feed-z'],'off-page selection remains in controlled state');
  assert.deepEqual(result.selectedInData,['feed-z'],'selected row model uses all supplied client data');
  assert.deepEqual(result.selectedOnPage,[],'visible page has no selected rows');
  assert.equal(result.pageCount,3);
  const lastPage=snapshot({...options,pageIndex:2});
  assert.deepEqual(lastPage.ids,['feed-z']);
  assert.deepEqual(lastPage.selectedIds,['feed-z']);
  assert.deepEqual(lastPage.selectedInData,['feed-z']);
  assert.deepEqual(lastPage.selectedOnPage,['feed-z'],'selection follows the stable ID onto its page');
});
test('real v9 manual pagination respects server row count, not current-page length',()=>{
  const result=snapshot({
    manual:true,rows:[seeds[2]],pageIndex:1,pageSize:2,selection:{'feed-a':true,'feed-b':true},
  });
  assert.deepEqual(result.ids,['feed-b']);
  assert.equal(result.pageCount,3);
  assert.equal(result.canNextPage,true);
  assert.deepEqual(result.selectedIds,['feed-a','feed-b'],'selection retains IDs absent from supplied data');
  assert.deepEqual(result.selectedInData,['feed-b'],'manual page can only materialize supplied selected rows');
  assert.deepEqual(result.selectedOnPage,['feed-b']);
});
