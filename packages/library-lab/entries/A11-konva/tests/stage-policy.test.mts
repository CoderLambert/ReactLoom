import test from 'node:test';
import assert from 'node:assert/strict';
import {appendCard, canAddCard, MAX_SAMPLE_CARDS, stageWidth} from '../examples/stage-policy.ts';
test('narrow Stage honors actual host rather than forcing 320px overflow', () => {
  assert.equal(stageWidth(176.9), 176);
  assert.equal(stageWidth(320), 320);
  assert.equal(stageWidth(6000), 4096);
  assert.equal(stageWidth(0), null);
  assert.equal(stageWidth(NaN), null);
});
test('sample cap and duplicate ids keep canvas node count bounded', () => {
  let cards = [{id: 'first'}];
  assert.equal(appendCard(cards, {id:'first'}), cards);
  for (let i = 0; i < MAX_SAMPLE_CARDS + 4; i++) cards = appendCard(cards, {id:'new-' + i});
  assert.equal(cards.length, MAX_SAMPLE_CARDS);
  assert.equal(canAddCard(cards.length), false);
  assert.equal(appendCard(cards, {id:'never'}), cards);
});
