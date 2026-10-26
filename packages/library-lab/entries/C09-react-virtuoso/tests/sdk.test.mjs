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
