import test from 'node:test'
import assert from 'node:assert/strict'
import Papa from 'papaparse'

test('Papa Parse actually handles commas, quotes and embedded newline', () => {
  const input = 'title,url,note\n"React, Loom",https://example.org/feeds,"你好 ""世界""\n第二行"'
  const result = Papa.parse(input,{header:true,skipEmptyLines:'greedy'})
  assert.equal(result.errors.length,0)
  assert.equal(result.data.length,1)
  assert.equal(result.data[0].title,'React, Loom')
  assert.equal(result.data[0].note,'你好 "世界"\n第二行')
})

test('Papa unparse uses formula escaping for spreadsheet exports', () => {
  const exported = Papa.unparse([{title:'=2+3',url:'https://example.org'}],{escapeFormulae:true})
  assert.ok(exported.includes("'=2+3"),'dangerous formula must be prefixed with apostrophe')
  const roundtrip = Papa.parse(exported,{header:true})
  assert.equal(roundtrip.data[0].title,"'=2+3")
})

test('Papa Parse returns parse error for too many data fields',()=>{
  const result=Papa.parse('name,id\nA,1,extra',{header:true})
  assert.ok(result.errors.some(e=>e.code==='TooManyFields'))
})
