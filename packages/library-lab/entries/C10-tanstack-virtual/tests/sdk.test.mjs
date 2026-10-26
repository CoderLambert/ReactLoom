import test from 'node:test';
import assert from 'node:assert/strict';
import React,{useRef} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {useVirtualizer} from '@tanstack/react-virtual';

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
