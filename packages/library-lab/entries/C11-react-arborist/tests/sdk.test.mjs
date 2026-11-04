import test from 'node:test';
import assert from 'node:assert/strict';
import {adjustMoveIndex} from 'react-arborist';
test('real react-arborist helper corrects pre-removal target slots',()=>{
 const siblings=['a','b','c','d'];
 assert.equal(adjustMoveIndex({index:3,dragIds:['b'],siblingIds:siblings}),2);
 assert.equal(adjustMoveIndex({index:1,dragIds:['b'],siblingIds:siblings}),1);
});
test('real helper keeps target index for cross-parent moves',()=>{
 assert.equal(adjustMoveIndex({index:2,dragIds:['other-parent'],siblingIds:['a','b','c']}),2);
});
