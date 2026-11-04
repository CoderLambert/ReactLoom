import test from 'node:test';
import assert from 'node:assert/strict';
import {migrateChannelPreferences} from '../examples/migration-policy.mjs';

const defaults={view:'list',enabledByTenant:{'team-a':true,'team-b':false}};
test('v1 migration keeps only validated UI fields',()=>{
 assert.deepEqual(migrateChannelPreferences({enabled:false,view:'grid',tenant:'team-b',token:'secret'},1),
   {view:'grid',enabledByTenant:{'team-a':false,'team-b':false}});
});
test('string boolean is never treated as a boolean',()=>{
 assert.deepEqual(migrateChannelPreferences({enabled:'false',view:'GRID'},1),defaults);
});
test('unknown schema versions and malformed state are safe',()=>{
 for(const source of [null,[],false,27,'legacy'])
   assert.deepEqual(migrateChannelPreferences(source,1),defaults);
 assert.deepEqual(migrateChannelPreferences({enabled:false,view:'grid'},0),defaults);
 assert.deepEqual(migrateChannelPreferences({enabled:false,view:'grid'},3),defaults);
});
test('migration does not mutate input',()=>{
 const old=Object.freeze({enabled:false,view:'grid'});
 migrateChannelPreferences(old,1);assert.equal(old.enabled,false);
});
