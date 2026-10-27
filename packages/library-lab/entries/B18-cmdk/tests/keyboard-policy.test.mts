import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldTogglePalette, shouldSuppressCommandEnter} from '../examples/keyboard-policy.ts';

test('Ctrl+K or Meta+K opens outside inputs',()=>{
  for(const key of [{key:'k',ctrlKey:true},{key:'K',metaKey:true}]) assert.equal(shouldTogglePalette(key,false,false),true);
});
test('never steals shortcut from unrelated editors when closed',()=>{
  for(const key of [{key:'k',ctrlKey:true},{key:'k',metaKey:true}]) assert.equal(shouldTogglePalette(key,true,false),false);
});
test('same shortcut closes own modal even when input is focused',()=>{
  assert.equal(shouldTogglePalette({key:'k',ctrlKey:true},true,true),true);
});
test('modified and IME processing shortcuts are rejected',()=>{
  for(const event of [
    {key:'k'}, {key:'x',ctrlKey:true}, {key:'k',ctrlKey:true,altKey:true},
    {key:'k',ctrlKey:true,shiftKey:true},{key:'k',ctrlKey:true,isComposing:true},
    {key:'k',metaKey:true,keyCode:229},
  ]) assert.equal(shouldTogglePalette(event,false,false),false);
});
test('composition, trailing Enter and keycode 229 never run a command',()=>{
  for(const [event,composing,pending] of [
    [{key:'Enter'},true,false],[{key:'Enter'},false,true],
    [{key:'Enter',isComposing:true},false,false],[{key:'Enter',keyCode:229},false,false],
  ] as const) assert.equal(shouldSuppressCommandEnter(event,composing,pending),true);
});
test('normal Enter works after commit keyup; non-Enter keys are unaffected',()=>{
  assert.equal(shouldSuppressCommandEnter({key:'Enter'},false,false),false);
  assert.equal(shouldSuppressCommandEnter({key:'ArrowDown'},true,true),false);
});
