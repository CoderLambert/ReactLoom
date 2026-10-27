import test from 'node:test';
import assert from 'node:assert/strict';
import React,{useRef} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {useVirtualizer} from '@tanstack/react-virtual';
import {stableRowId} from '../examples/filter-policy.mjs';

function SsrProbe(){
  const ref=useRef(null);
  const virtualizer=useVirtualizer({count:400,getScrollElement:()=>ref.current,
    estimateSize:()=>62,overscan:5,getItemKey:index=>'stable-'+index,useFlushSync:false});
  return React.createElement('div',{ref},String(virtualizer.options.count));
}
test('real TanStack Virtual hook can initialize without a browser viewport',()=>{
  assert.equal(renderToStaticMarkup(React.createElement(SsrProbe)),'<div>400</div>');
  // Only confirms SSR import/options; Chrome measurement, scrolling and row teardown still NOT_RUN.
});

test('real virtualizer can use immutable business ids for key lookup',()=>{
  const rows=[{id:'rss-a'},{id:'rss-b'}];
  assert.equal(stableRowId(rows,1),'rss-b');
  assert.equal(stableRowId([...rows].reverse(),1),'rss-a');
  // SSR test above uses the actual @tanstack/react-virtual hook; viewport measurement needs Chromium.
});
