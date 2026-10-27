import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldApplyFilterOnKeyDown} from '../examples/ime-guard.ts';
const base={key:'Enter',composing:false,nativeComposing:false,legacyKeyCode:13,suppressNextEnter:false};
test('plain Enter commits',()=>assert.equal(shouldApplyFilterOnKeyDown(base),true));
test('candidate selection during composition never commits',()=>{
 assert.equal(shouldApplyFilterOnKeyDown({...base,composing:true}),false);
 assert.equal(shouldApplyFilterOnKeyDown({...base,nativeComposing:true}),false);
 assert.equal(shouldApplyFilterOnKeyDown({...base,legacyKeyCode:229}),false);
});
test('compositionend before trailing Enter keydown is guarded',()=>{
 assert.equal(shouldApplyFilterOnKeyDown({...base,suppressNextEnter:true}),false);
 assert.equal(shouldApplyFilterOnKeyDown({...base,suppressNextEnter:false}),true);
});
test('other keyboard keys do not submit',()=>assert.equal(shouldApplyFilterOnKeyDown({...base,key:'Escape'}),false));
