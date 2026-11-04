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

import {reportCSV} from '../examples/report.mjs'

test('actual parser rejects extra or duplicate header columns before importing any row',()=>{
  assert.equal(reportCSV('title,url,note,admin\nA,https://example.org/rss,hi,true').accepted.length,0)
  assert.equal(reportCSV('title,url,title\nA,https://example.org/rss,hi').accepted.length,0)
})
test('actual parser keeps well-formed rows and rejects malformed field counts',()=>{
  const report=reportCSV('title,url,note\n=2+3,https://example.org/rss,good\nB,https://example.org/extra,note,illegal')
  assert.equal(report.accepted.length,1)
  assert.ok(report.rejected.length>=1)
  assert.ok(report.escapedCsv.includes("'=2+3"))
})
test('unclosed quotes fail closed without partial import',()=>{
  const report=reportCSV('title,url,note\nA,https://example.org/rss,"broken\nB,https://example.org/next,ok')
  assert.equal(report.accepted.length,0)
  assert.ok(report.parserErrors.length>0)
})
