import test from 'node:test';
import assert from 'node:assert/strict';
import {checkVisualizerReport} from './report-policy.mjs';
const html='<html><body>'+'x'.repeat(150)+'</body></html>';
const md='# Bundle\n| chunk | bytes |\n|---|---|\n| main.js | 300 |\n'+'x'.repeat(120);
const raw=JSON.stringify({version:1,tree:{}})+' '.repeat(120);
test('HTML/Markdown must have respective output structures',()=>{
  assert.equal(checkVisualizerReport('basic',html),true);
  assert.equal(checkVisualizerReport('business',md),true);
  assert.throws(()=>checkVisualizerReport('business',html));
});
test('versioned raw-data alone is insufficient without actual output chunks',()=>{
  assert.equal(checkVisualizerReport('advanced',raw,['main-123.js','heavy-456.js']),true);
  assert.throws(()=>checkVisualizerReport('advanced',raw,['main.js']));
  assert.throws(()=>checkVisualizerReport('advanced',JSON.stringify({tree:{}}).padEnd(130),['a.js','b.js']));
});
test('short or mislabelled reports cannot pass',()=>{
  assert.throws(()=>checkVisualizerReport('basic','<html></html>'));
  assert.throws(()=>checkVisualizerReport('advanced',html,['a.js','b.js']));
  assert.throws(()=>checkVisualizerReport('wrong',raw));
});
