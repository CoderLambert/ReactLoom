# F04 ExcelJS 独立复核（2026-11-18）

作者确认STABLE后读取最终输入，仅写此报告，无entry/shared变更，无作者SDK4/policy6/三CLI整套重跑。catalog→library/agent/guide/实际core与row-policy/三个CLI/verification/local-validation核对。独立复制core.mjs、row-policy.mjs到ownedtmp，用新两行生成自产XLSX并真实ExcelJS writeBuffer/load回读，非网页执行。

**Spec PASS，Quality Node层PASS；网页CLI/来源展示和正式build/browser NOT_RUN待主控。无阻断问题。** 需要样式/冻结/显式公式对象时选择ExcelJS合理；CSV和公式求值器是其他职责。

| 六项 | 独立状态 | 证据 |
| --- | --- | --- |
| 技术准确 | PASS真实Node SDK | 新2rows/shared generate/writeBuffer/load，样式冻结/公式缓存/String往返匹配 |
| 解释清楚 | PASS | 普通String非Formula、撇号改变值、缓存来自JS非引擎计算、预算非Excel最大数均明确 |
| Demo有用 | PASS Node目标 | 三CLI对应样式/汇总/保守文本；作者三CLI原日志exit0；独立不整套重复 |
| 可迁入 | PASS实际复制运行 | 核心2文件即可被新consumer调用，选CLI另带对应入口；全套六件含verify，不需React/env/CSS |
| 官方材料 | PASS | 上游中文README_zh原字节重取相同，MIT LICENSE与实装4.4.0字段；GitHub frame deny明确blocked |
| 结果可复核 | PASS Node；browser NOT_RUN | 下面真实argv/cwd/exit/raw；不把Node当browser、结构回读当桌面视觉/公式重算 |

## SDK/业务政策核对

实际`packages/library-lab/node_modules/exceljs/lib/doc/cell.js:1062–1083`：String/boxed String是String类型，只有formula/sharedFormula对象是Formula；734–745复制公式和result到model，817–822仅get/set缓存，无计算SUM。因此保守safeSpreadsheetText给=+-@字面前缀加撇号属于应用合同，不是“ExcelJS自动执行公式所以必须阻止”，指南已纠正。

本例checkRows在newWorkbook之前，1–500rows；id NFC/trim和Unicode字母数字起始字符表，输出保留规范化大小写，以en-US小写去重。新输入decomposed é变é-7、uppercaseÉ-7与其重复拒绝。它不是全Unicode相似字/身份认证或内容hash。source trim/≤160UTF16/C0及DEL限制再保守撇号；boxString虽然库支持，policy明确只接受原始string，当前合同一致。

数值非负safeinteger，正向累计≤999999999999999也约束单项；新输入边界恰好通过，追加1时拒绝。15位预算是保守应用选择，不是Excel最大数。没有浮点/货币精度或公式重算声明。

冻结视图ySplit1、表头bold/FF275B49、两个String源字段及literal撇号都从真实自产bytes回读。新consumer将合计缓存故意改为777后writeBuffer/load仍777，直接证明SDK保留调用方缓存而没有替代SUM计算。受控SUM表达式仅引用数值列，未拼接不可信source/id。

## 独立迁入与实际输出

新consumer完整内容：
```js
import assert from 'node:assert/strict'
import ExcelJS from 'exceljs'
import {generateWorkbook,inspectWorkbook} from './core.mjs'
import {checkRows,normalizeRowId,safeSpreadsheetText,MAX_EXCEL_INTEGER} from './row-policy.mjs'
const rows=[{id:' e\u0301-7 ',source:'=1+1',reads:7,stars:2},{id:'Node_2',source:"'literal",reads:3,stars:4}]
const result=await generateWorkbook('business',rows)
assert.deepEqual(result.totals,{reads:10,stars:6})
const summary=await inspectWorkbook(result.bytes)
assert.equal(summary.rowCount,4);assert.equal(summary.firstId,'é-7');assert.equal(summary.firstSource,"'=1+1")
const book=new ExcelJS.Workbook();await book.xlsx.load(result.bytes)
const sheet=book.getWorksheet('Sources')
assert.equal(sheet.views[0].ySplit,1);assert.equal(sheet.getCell('A1').font.bold,true)
assert.equal(sheet.getCell('A1').fill.fgColor.argb,'FF275B49')
assert.equal(sheet.getCell('B2').type,ExcelJS.ValueType.String)
assert.equal(sheet.getCell('B3').value,"'literal")
assert.deepEqual(sheet.getCell('C4').value,{formula:'SUM(C2:C3)',result:10})
sheet.getCell('C4').value={formula:'SUM(C2:C3)',result:777}
sheet.getCell('E2').value='=2+2'
const changed=await book.xlsx.writeBuffer(), reread=new ExcelJS.Workbook()
await reread.xlsx.load(changed)
assert.equal(reread.getWorksheet('Sources').getCell('C4').result,777)
assert.equal(reread.getWorksheet('Sources').getCell('E2').type,ExcelJS.ValueType.String)
assert.equal(normalizeRowId(' e\u0301-7 '),'é-7')
assert.throws(()=>checkRows([...rows,{id:'É-7',source:'duplicate',reads:0,stars:0}]),/duplicate/)
assert.equal(checkRows([{id:'ceiling',source:'ok',reads:MAX_EXCEL_INTEGER,stars:0}]).reads,MAX_EXCEL_INTEGER)
assert.throws(()=>checkRows([{id:'a',source:'ok',reads:MAX_EXCEL_INTEGER,stars:0},{id:'b',source:'ok',reads:1,stars:0}]),/aggregate/)
assert.throws(()=>safeSpreadsheetText(new String('boxed')),/string/)
console.log(JSON.stringify({layer:'ACTUAL_NODE_EXCELJS',version:ExcelJS.Workbook ? '4.4.0':'unknown',rows:result.sourceRows,bytes:result.bytes.byteLength,normalizedID:summary.firstId,sourceType:'String',literalApostrophe:true,formula:'SUM(C2:C3)',providedCache:10,wrongCacheStill777:true,freeze:sheet.views[0].ySplit,headerFill:sheet.getCell('A1').fill.fgColor.argb,policy:'NFCcaseDuplicateAndAggregateBudgetRejected'}))

```

命令记录：
```json
{
  "cwd": "/home/lambert/githubRepos/lambert/ReactLoom",
  "argv": [
    "node",
    "/tmp/f04-independent-y4584okw/consumer.mjs"
  ],
  "exit": 0,
  "output": "{\"layer\":\"ACTUAL_NODE_EXCELJS\",\"version\":\"4.4.0\",\"rows\":2,\"bytes\":6825,\"normalizedID\":\"é-7\",\"sourceType\":\"String\",\"literalApostrophe\":true,\"formula\":\"SUM(C2:C3)\",\"providedCache\":10,\"wrongCacheStill777\":true,\"freeze\":1,\"headerFill\":\"FF275B49\",\"policy\":\"NFCcaseDuplicateAndAggregateBudgetRejected\"}\n"
}
```

Node consumer真实SDK一次；其中包含新的业务政策输入，不混用作者policy6计数。现有node_modules软链，不称fresh-install。没有TSX/typecheck必要性；两必需ESM文件实际复制运行通过，其余入口是相对import包装；没有需要额外安装的未声明运行依赖。仅清理本次owned临时目录，未写xlsx到用户目录。

## 固定官方字节

```json
[
  {
    "url": "https://raw.githubusercontent.com/exceljs/exceljs/ac96f9a61e9799c7776bd940f05c4a51d7200209/README_zh.md",
    "status": 200,
    "bytes": 198886,
    "sha256": "7cf73c98a68c09bb2728c739f0fe83ecc3771edadefc5e79f6435af9566cd224",
    "sameBytes": true
  },
  {
    "url": "https://raw.githubusercontent.com/exceljs/exceljs/ac96f9a61e9799c7776bd940f05c4a51d7200209/LICENSE",
    "status": 200,
    "bytes": 1084,
    "sha256": "2ed526b7e7c7681dc2347995b5036ddf73dc27d0539cdea59b6d4a72b63a57a0",
    "sameBytes": true
  }
]
```

README SHA与library metadata一致；固定tree候选含README_zh.md优先取中文，language zh-CN正确。LICENSE是MIT原文，实际package4.4.0/MIT一致。official/homepage-headers.txt实际HTTP200仍有x-frame-options:deny与CSP frame-ancestors none，blocked而不是unknown/allowed合理，提供直达。

## 信任/生命周期与待验

inspectWorkbook是公开普通load函数，没有任意外来ZIP验证/展开预算；guide明确调用方只传自产bytes。不能把它当用户XLSX安全导入器，当前CLI无任何外部文件入口，因此无此功能缺口。无宏/ZIPbomb、外链/公式沙箱、流式、桌面布局/打印或再计算保证。无文件句柄/网络/子进程/监听需释放；只有局部内存Workbook和Buffer，不需要造destroy/Abort API。

主控浏览器仅验证三CLI说明与固定中文来源展示；不是执行Node或生成浏览器下载。当前未在本报告取得该展示运行结果，browser/formal三项仍NOT_RUN。无本批必须修复的发现；保守撇号导致字面变化、外部xlsx不支持都已经充分解释。


实装字段额外命令：cwd同上，`node -e "const p=require('./packages/library-lab/node_modules/exceljs/package.json'); console.log(JSON.stringify({version:p.version,license:p.license,main:p.main}))"` exit0，stdout `{"version":"4.4.0","license":"MIT","main":"./excel.js"}`。consumer输出version是试验目标标签，实际版本以上述package字段为准。
