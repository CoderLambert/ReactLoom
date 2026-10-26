import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceLanguage} from '../src/lib/source-language.mjs';
test('recognises reusable TypeScript and JavaScript source without extensions confusion',()=>{
  for(const [path,expectation] of [['src/demo.tsx','tsx'],['source/App.JSX','jsx'],['tests/example.test.mjs','javascript'],['types/index.mts','typescript'],['test/scope.cts','typescript'],['styles/main.css','css']])
    assert.equal(sourceLanguage(path),expectation,path);
});
test('unknown and untrusted extensions are plain text rather than executable HTML',()=>{
  for(const value of ['file.svg','danger.exe',null,[],{},'file.wasm'])assert.equal(sourceLanguage(value),'');
});
