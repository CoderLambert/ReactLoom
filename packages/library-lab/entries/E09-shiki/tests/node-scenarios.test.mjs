import test from 'node:test'
import assert from 'node:assert/strict'
import {codeToTokens} from 'shiki/bundle/web'
test('real Shiki tokenizes TypeScript preserving source content',async()=>{
  const src='const count: number = 2'
  const {tokens}=await codeToTokens(src,{lang:'typescript',theme:'github-light'})
  assert.equal(tokens.map(row=>row.map(token=>token.content).join('')).join('\n'),src)
})
test('real Shiki returns text tokens rather than executable DOM',async()=>{
  const src='<script>alert(1)</script>'
  const {tokens}=await codeToTokens(src,{lang:'html',theme:'github-light'})
  assert.equal(tokens.flat().map(token=>token.content).join(''),src)
})
