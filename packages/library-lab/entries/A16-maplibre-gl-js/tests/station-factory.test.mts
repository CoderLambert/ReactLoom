import test from 'node:test';
import assert from 'node:assert/strict';
import {makeLocalStation,MAX_EXTRA_STATIONS} from '../examples/station-factory.ts';
test('rapid MapLibre additions preserve each captured coordinate',()=>{
 const stations=Array.from({length:MAX_EXTRA_STATIONS},(_,i)=>makeLocalStation(i+1));
 assert.equal(new Set(stations.map(x=>x.id)).size,MAX_EXTRA_STATIONS);
 assert.deepEqual(stations.slice(0,2).map(x=>x.id),['local-1','local-2']);
 assert.equal(stations[0].label,'本地站点 1');
 assert.ok(Math.abs(stations[1].longitude-115.24)<1e-9);
 assert.ok(stations.every(s=>s.longitude<=180&&s.longitude>=-180));
});
test('invalid or excess MapLibre ids rejected',()=>{
 for(const value of [0,-1,1.1,MAX_EXTRA_STATIONS+1,Infinity])assert.throws(()=>makeLocalStation(value),RangeError);
});
