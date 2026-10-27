import test from 'node:test';
import assert from 'node:assert/strict';
import * as Y from 'yjs';

function exchange(left,right){
 const a=Y.encodeStateAsUpdate(left,Y.encodeStateVector(right));
 const b=Y.encodeStateAsUpdate(right,Y.encodeStateVector(left));
 Y.applyUpdate(right,a);Y.applyUpdate(left,b);return [a.byteLength,b.byteLength];
}
test('real Yjs merges independent edits from disconnected documents',()=>{
 const a=new Y.Doc(),b=new Y.Doc();
 try {
  a.getMap('items').set('left',{title:'A'});
  b.getMap('items').set('right',{title:'B'});
  const lengths=exchange(a,b);
  assert.ok(lengths.every(n=>n>0));
  assert.deepEqual(a.getMap('items').toJSON(),b.getMap('items').toJSON());
  assert.equal(Object.keys(a.getMap('items').toJSON()).length,2);
 } finally {a.destroy();b.destroy();}
});
test('real Yjs same-key conflicts converge without assuming winner',()=>{
 const a=new Y.Doc(),b=new Y.Doc();
 try {
  a.getMap('meta').set('title','A');b.getMap('meta').set('title','B');
  exchange(a,b);
  const title=a.getMap('meta').get('title');
  assert.ok(['A','B'].includes(title));
  assert.equal(title,b.getMap('meta').get('title'));
 } finally {a.destroy();b.destroy();}
});
test('real Yjs delta after synchronization is empty-ish and safe to reapply',()=>{
 const a=new Y.Doc(),b=new Y.Doc();
 try {
  a.getMap('feeds').set('one',1);exchange(a,b);
  const delta=Y.encodeStateAsUpdate(a,Y.encodeStateVector(b));
  assert.ok(delta instanceof Uint8Array);
  Y.applyUpdate(b,delta);
  assert.deepEqual(a.getMap('feeds').toJSON(),b.getMap('feeds').toJSON());
 } finally {a.destroy();b.destroy();}
});
