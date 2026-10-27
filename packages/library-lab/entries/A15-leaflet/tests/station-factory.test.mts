import test from 'node:test';
import assert from 'node:assert/strict';
import {makeLocalLocation,MAX_EXTRA_LOCATIONS,canAddLocalLocation} from '../examples/station-factory.ts';
test('sequential clicks capture unique Leaflet marker identity',()=>{
 const stations=Array.from({length:MAX_EXTRA_LOCATIONS},(_,i)=>makeLocalLocation(i+1));
 assert.equal(new Set(stations.map(x=>x.id)).size,MAX_EXTRA_LOCATIONS);
 assert.deepEqual(stations.slice(0,2).map(x=>x.id),['site-1','site-2']);
 assert.ok(Math.abs(stations[0].center[0]-41.9781)<1e-9);
 assert.ok(stations.every(s=>s.center[0]<=90&&s.center[0]>=-90));
 assert.equal(canAddLocalLocation(stations),false);
});
test('invalid or excess Leaflet fixture ids are rejected',()=>{
 for(const value of [0,-1,1.1,Infinity,NaN,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>makeLocalLocation(value),RangeError);
});

test('deletion restores capacity without reusing marker identity',()=>{
 const full=Array.from({length:MAX_EXTRA_LOCATIONS},(_,i)=>makeLocalLocation(i+1));
 const remaining=full.slice(0,-1);
 assert.equal(canAddLocalLocation(remaining),true);
 const next=makeLocalLocation(MAX_EXTRA_LOCATIONS+1);
 assert.equal(next.id,'site-41');
 assert.equal(canAddLocalLocation([...remaining,next]),false);
 assert.equal(new Set([...remaining,next].map(x=>x.id)).size,MAX_EXTRA_LOCATIONS);
 assert.ok(next.center[0]<90&&next.center[0]>-90);
});
test('normal source records do not consume simulated marker capacity',()=>{
 const normal=[{id:'sea'},{id:'sfo'},{id:'nyc'}];
 assert.equal(canAddLocalLocation(normal),true);
 assert.equal(canAddLocalLocation([...normal,...Array.from({length:40},(_,i)=>makeLocalLocation(i+1))]),false);
});
