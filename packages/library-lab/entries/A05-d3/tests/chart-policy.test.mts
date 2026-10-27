import test from 'node:test';
import assert from 'node:assert/strict';
import {measuredWidth, visibleSelection, visibleSeries} from '../examples/chart-policy.ts';
const data = [
  {day:'Mon', views:48, saves:5},
  {day:'Tue', views:72, saves:14},
  {day:'Wed', views:103, saves:20},
];
test('window and threshold filter chart and selection consistently', () => {
  const points = visibleSeries(data, 2, 80);
  assert.deepEqual(points.map(x => x.day), ['Wed']);
  assert.equal(visibleSelection(points, 'Tue'), null);
  assert.equal(visibleSelection(points, 'Wed')?.views, 103);
});
test('empty viewport and empty result do not invent a data point', () => {
  assert.deepEqual(visibleSeries(data, 0, 0), []);
  assert.deepEqual(visibleSeries(data, 3, 1000), []);
  assert.equal(visibleSelection([], 'Wed'), null);
});
test('invalid measurements are ignored; finite widths are bounded', () => {
  for (const invalid of [0, -8, NaN, Infinity]) assert.equal(measuredWidth(invalid), null);
  assert.equal(measuredWidth(158.8), 158);
  assert.equal(measuredWidth(999999), 4096);
});
