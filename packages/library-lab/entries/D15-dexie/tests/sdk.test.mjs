import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import Dexie from 'dexie';
test('real Dexie indexed lookup and transaction rollback on duplicate key', async () => {
 const name='dexie-test-'+crypto.randomUUID();
 const db=new Dexie(name);
 db.version(1).stores({feeds:'&id,group'});
 try {
  await db.open();
  const table=db.table('feeds');
  await table.add({id:'a',group:'技术'});
  await assert.rejects(db.transaction('rw',table,async()=>{
    await table.add({id:'b',group:'技术'});
    await table.add({id:'a',group:'重复'});
  }));
  assert.deepEqual((await table.toArray()).map(r=>r.id),['a']);
  assert.equal((await table.where('group').equals('技术').count()),1);
 } finally {db.close();await Dexie.delete(name);}
});
test('real Dexie upgrade retains rows and installs compound index', async () => {
 const name='dexie-test-upgrade-'+crypto.randomUUID();
 const legacy=new Dexie(name);legacy.version(1).stores({feeds:'&id,group,updatedAt'});
 await legacy.table('feeds').add({id:'a',group:'技术',updatedAt:100});
 legacy.close();
 const modern=new Dexie(name);
 modern.version(1).stores({feeds:'&id,group,updatedAt'});
 modern.version(2).stores({feeds:'&id,group,updatedAt,[group+updatedAt]'});
 try {
  const items=await modern.table('feeds').where('[group+updatedAt]').between(['技术',0],['技术',999]).toArray();
  assert.equal(modern.verno,2);
  assert.deepEqual(items.map(x=>x.id),['a']);
 } finally {modern.close();await Dexie.delete(name);}
});
