import test from 'node:test';
import assert from 'node:assert/strict';
import {parseAsInteger, parseAsString} from 'nuqs/server';

test('nuqs real integer parser accepts and rejects URL input', () => {
 assert.equal(parseAsInteger.parse('7'),7);
 assert.equal(parseAsInteger.parse('broken'),null);
});
test('nuqs real parsers preserve URL string semantics', () => {
 assert.equal(parseAsString.parse('你好'), '你好');
 assert.equal(parseAsString.parse(''), '');
});
test('nuqs real integer serialization is stable', () => {
 assert.equal(parseAsInteger.serialize(23), '23');
});

import {deriveSearchView} from '../examples/url-policy.mjs';
test('real nuqs server parser feeds safely clamped URL view',()=>{
 const page=parseAsInteger.parse('9007199254740993');
 const view=deriveSearchView({level:'advanced',query:'React',group:'tech',page},[{id:'rss',name:'React',group:'tech'}]);
 assert.equal(view.safePage,1);
 assert.equal(view.pageItems[0].id,'rss');
});
