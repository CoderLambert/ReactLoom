import test from 'node:test';
import assert from 'node:assert/strict';
import {makeLocalLocation,MAX_EXTRA_LOCATIONS} from '../examples/station-factory.ts';
test('sequential clicks capture unique Leaflet marker identity',()=>{
 const stations=Array.from({length:MAX_EXTRA_LOCATIONS},(_,i)=>makeLocalLocation(i+1));
 assert.equal(new Set(stations.map(x=>x.id)).size,MAX_EXTRA_LOCATIONS);
 assert.deepEqual(stations.slice(0,2).map(x=>x.id),['site-1','site-2']);
 assert.ok(Math.abs(stations[0].center[0]-41.9781)<1e-9);
 assert.ok(stations.every(s=>s.center[0]<=90&&s.center[0]>=-90));
});
test('invalid or excess Leaflet fixture ids are rejected',()=>{
 for(const value of [0,-1,1.1,MAX_EXTRA_LOCATIONS+1,Infinity])assert.throws(()=>makeLocalLocation(value),RangeError);
});
