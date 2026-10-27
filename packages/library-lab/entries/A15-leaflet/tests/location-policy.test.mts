import test from 'node:test';
import assert from 'node:assert/strict';
import {selectedVisibleId,shiftLocation} from '../examples/location-policy.ts';
const data=[{id:'a',status:'paused' as const,center:[84.9,179.9] as [number,number]},
 {id:'b',status:'online' as const,center:[41,-80] as [number,number]},
 {id:'c',status:'online' as const,center:[32,-120] as [number,number]}];
test('selection stays tied to visible markers with offline filter',()=>{
 assert.equal(selectedVisibleId(data,false,'a'),'a');
 assert.equal(selectedVisibleId(data,true,'a'),'b');
 assert.equal(selectedVisibleId(data,true,'c'),'c');
 assert.equal(selectedVisibleId(data.filter(x=>x.id!=='b'),true,'b'),'c');
 assert.equal(selectedVisibleId(data.filter(x=>x.status==='paused'),true,'a'),'');
});
test('coordinate shift clamps to Leaflet world limits without mutation',()=>{
 const shifted=shiftLocation(data,'a',10);
 assert.deepEqual(shifted[0].center,[85,180]);
 assert.deepEqual(data[0].center,[84.9,179.9]);
 assert.equal(shifted[1],data[1]);
});
test('invalid delta and missing locations never add invalid markers',()=>{
 assert.deepEqual(shiftLocation(data,'a',Infinity),data);
 assert.deepEqual(shiftLocation(data,'z',0.25),data);
});
