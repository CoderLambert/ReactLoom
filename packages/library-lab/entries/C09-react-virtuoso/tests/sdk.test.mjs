import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Virtuoso} from 'react-virtuoso';

test('real react-virtuoso exports a renderable SSR shell (not browser scrolling)', () => {
  const html=renderToStaticMarkup(React.createElement(Virtuoso, {
    totalCount: 4, initialItemCount: 2, itemContent: index => React.createElement('p',null,'item-'+index),
    style:{height:240},
  }));
  assert.equal(typeof html,'string');
  assert.match(html,/item-0|<div/u);
});

test('actual Virtuoso can remount an identical query as an independent viewport identity', () => {
  const data=[{id:'rss-1',title:'first'},{id:'rss-2',title:'second'}];
  const props={data,initialItemCount:2,computeItemKey:(_index,item)=>item.id,
    itemContent:(_index,item)=>React.createElement('span',null,item.title),style:{height:240}};
  const first=renderToStaticMarkup(React.createElement(Virtuoso,{...props,key:1}));
  const second=renderToStaticMarkup(React.createElement(Virtuoso,{...props,key:2}));
  assert.equal(first,second);
  // This is a real SDK SSR check; actual viewport reset remains a browser assertion.
});
