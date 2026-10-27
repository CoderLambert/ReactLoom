import test from 'node:test';
import assert from 'node:assert/strict';
import {isValidRejection,normalizeRejectionReason,MAX_REJECTION_REASON_LENGTH} from '../examples/review-policy.mjs';
test('reject reason is required by the actor even if controls are bypassed',()=>{
 for(const reason of ['', '   ', null, undefined, 'x'.repeat(MAX_REJECTION_REASON_LENGTH+1)]) {
  assert.equal(isValidRejection({type:'REJECT',reason}),false);
 }
 assert.equal(isValidRejection({type:'APPROVE',reason:'ok'}),false);
});
test('valid Unicode rejection reason survives canonical normalization',()=>{
 assert.equal(isValidRejection({type:'REJECT',reason:'  源站信息不完整  '}),true);
 assert.equal(normalizeRejectionReason('  源站信息不完整  '),'源站信息不完整');
 assert.equal(isValidRejection({type:'REJECT',reason:'😀'.repeat(MAX_REJECTION_REASON_LENGTH)}),true);
});
