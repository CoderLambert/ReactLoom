import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import Dexie from 'dexie';
import {sameFeedSnapshot} from '../examples/rollback-policy.mjs';
test('real Dexie indexed lookup and transaction rollback on duplicate key', async () => {
 const name='dexie-test-'+crypto.randomUUID();
 const db=new Dexie(name);
 db.version(1).stores({feeds:'&id,group,updatedAt'});
 try {
  await db.open();
  const table=db.table('feeds');
  await table.add({id:'a',group:'技术',updatedAt:100,read:false});
  const before=await table.toArray();
  await assert.rejects(db.transaction('rw',table,async()=>{
    await table.add({id:'b',group:'技术',updatedAt:200,read:false});
    await table.add({id:'a',group:'重复',updatedAt:999,read:true});
  }));
  assert.ok(sameFeedSnapshot(before,await table.toArray()),'rejected transaction must preserve all record values');
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
 modern.version(2).stores({feeds:'&id,group,updatedAt,[group+updatedAt]'}).upgrade(tx=>
  tx.table('feeds').toCollection().modify(row=>{if(row.read===undefined)row.read=false;})
 );
 try {
  const items=await modern.table('feeds').where('[group+updatedAt]').between(['技术',0],['技术',999]).toArray();
  assert.equal(modern.verno,2);
  assert.deepEqual(items.map(x=>x.id),['a']);
  assert.equal(items[0].read,false,'legacy field must be migrated during version upgrade');
 } finally {modern.close();await Dexie.delete(name);}
});
