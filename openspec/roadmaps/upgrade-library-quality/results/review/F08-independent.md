# F08 @react-pdf/renderer 独立复核

结论：**Spec PASS（源码/迁入/Node产物范围）；质量六维分层通过，浏览器与视觉版式待主控。无新增实质缺陷。** 本人非本条作者，只写本报告，未改entry/shared/队列、未跑作者完整SDK2/policy6、共享browser/build/full typecheck。

## 检索与六维

入口实际执行 `node packages/library-lab/scripts/find-library.mjs --id F08 --agent`。第一次被全目录F06 README metadata错误拦截，已通知主控；主控修正F06后相同命令exit0正确返回F08。该错误不属于F08。随后读取library/agent/guide/verification、四迁入源与宿主转发、local-validation、官方来源和browser提案。

| 维度 | 状态与独立证据 |
| --- | --- |
| 技术准确 | PASS 源码+实际Node：实装4.9.0/MIT、React原语Document/Page/View/Text/StyleSheet，实际pdf().toBlob；新37行同源布局产物5626bytes，PDF.js解析2页，含标题/首末行/数值及字面尖括号。不是截图、阅读器或OCR。 |
| 解释清楚 | PASS：Node main/browser映射、ASCII/Helvetica、可信固定title、文字/文件头不证明视觉、不可物理取消toBlob均明确。无字体/图片网络能力宣传。 |
| 实验价值 | PASS 源码；browser NOT_RUN：basic1行/business3行/advanced100行与141前置拒绝，后者不是SDK故障。business明确是摘要目标，未称独立分页引擎。实际下载/分页视觉由主控负责。 |
| 完整迁入 | PASS：四必需原件example.tsx、report.tsx、report-policy.mjs/.d.mts复制后strict编译；demo仅转发可省。无需Provider/CSS/env/额外网络。三个level消费均编译。 |
| 官方资料 | PASS：独立重新下载固定commit包README和LICENSE，与保存逐字节相同；包真实版本/license/main/browser核对。homepage实测200无阻止头但无嵌入证据，unknown合适。 |
| 验证诚实 | PASS 分层：作者SDK2与policy6分别保存且未重跑；本复核新SDK consumer1次成功（renderer产物并PDF.js解析），纯策略新增3个负面输入+拣字段/复制断言，不能计SDK例数；browser/版式未运行，正式三项NOT_RUN保留。 |

## 源码与生命周期核查

example.tsx:36–41在await前running ref单飞，disabled只作UI反馈；validatedRows:53–61先于SDK:62。成功后:63先比较epoch，过期Blob不createURL；卸载:29递增epoch，:30–32仅revoke自有URL；keyed level:12重建独立会话。成功先create新URL再release旧URL:65–67；错误:72–76清链接/bytes并release。卸载后finally不setState。没有abort/destroy API、Worker、订阅/timer被伪称清理；晚Blob结果忽略不等于停止布局。

运行中仍显示上一成功下载链接是当前源码行为，文档没有承诺开始就清空；新成功替换，失败清空。141行从同一generate路径前置拒绝，不进入renderer，不当成SDK异常。ReportDocument低层接受可信固定ASCII title、已validated rows，迁出接任意title需新增预算；该合同已在guide/agent写明，无隐藏通用输入承诺。

report-policy验证1..140、ASCII ID1..48且大小写不敏感去重、printable ASCII name1..70、articles整数0..1,000,000，返回新对象并丢额外字段。尖括号只是Text字面，不能当HTML sanitizer。新consumer实际解析保留`Review <literal> item 0`。行wrap=false、Page wrap和fixed页脚确实接真实renderer，不从Promise成功推导视觉无裁切。

browser.spec.ts探针包装真实Blob构造与URL创建/回收，注入URL失败只称受控分支。其迟到路径等待真实PDF Blob数增加而URL数不变，不只看DOM消失；主控仍应核对实际挂载入口与下载PDF渲染。本复核未执行该提案，未把它算PASS。

## 新consumer：实际命令与输出

cwd均 `/home/lambert/githubRepos/lambert/ReactLoom`。临时目录只复制四运行文件并链接现有Lab node_modules；本次不是fresh install。strict/ES2022/ESNext/Bundler/react-jsx/DOM/types[]，skipLibCheck只跳第三方声明。编译后为Node ESM把生成JS的`./report`改为`./report.js`，并显式复制运行mjs（编译器沿d.mts解析不会替使用方打包它）。这不是修改原件；Vite bundler处理原始extensionless路径。

最终命令：

```text
pnpm --filter @reactloom/library-lab exec tsc -p /tmp/f08-independent-2sx285gl/tsconfig.json
exitCode: 0
stdout/stderr: (empty)
node /tmp/f08-independent-2sx285gl/out/consumer.js
exitCode: 0
Warning: UnknownErrorException: Ensure that the `standardFontDataUrl` API parameter is provided.
{
  "renderer": "4.9.0",
  "newRows": 37,
  "blobType": "application/pdf",
  "bytes": 5626,
  "parsedPages": 2,
  "title": true,
  "literalAngleBrackets": true,
  "lastRow": true,
  "policyRejects": 3,
  "copiedFields": true,
  "scope": "Node renderer + Node PDF.js parse; no browser/visual"
}
```

37个新ID为audit_0..audit_36，articles1000..964，末行`Last audit record`；标题`Independent 37 row audit`。额外unused字段丢弃且数组/首行对象均复制；分别拒绝Same/same重ID、NUL名称、1.5数量。PDF.js仅用于解析本次实际Blob，不替代pdftoppm/浏览器像素验收；standardFontDataUrl警告来自该Node解析，原样保留。

保留两次review harness失败：初次 `/tmp/f08-independent-7vta8kb3/tsconfig.json` tsc exit1，TS5011要求显式rootDir；补src rootDir后 `/tmp/f08-independent-jagwcb47/tsconfig.json` compile exit0，但Node exit1 ERR_MODULE_NOT_FOUND report-policy.mjs。显式复制运行mjs后最终通过。这是临时Node输出项目配置错误，不是Vite迁入缺陷。每次ownedtmp已清理；没有因此重跑作者套件。

可复现独立脚本（运行时会创建并清理ownedtmp）：

```python
import pathlib,tempfile,shutil,json,subprocess
root=pathlib.Path.cwd();entry=root/'packages/library-lab/entries/F08-react-pdf-renderer';tmp=pathlib.Path(tempfile.mkdtemp(prefix='f08-independent-'));src=tmp/'src';src.mkdir();(tmp/'node_modules').symlink_to(root/'packages/library-lab/node_modules',target_is_directory=True)
for f in ['example.tsx','report.tsx','report-policy.mjs','report-policy.d.mts']:shutil.copy2(entry/'examples'/f,src/f)
(tmp/'package.json').write_text('{"type":"module"}')
(src/'consumer.tsx').write_text('''import {pdf} from '@react-pdf/renderer'
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs'
import Viewer from './example.js'
import {ReportDocument,validatedRows} from './report.js'
const check=(v:unknown,m:string)=>{if(!v)throw Error(m)}
export const levels=[<Viewer level="basic"/>,<Viewer level="business"/>,<Viewer level="advanced"/>]
const input=Array.from({length:37},(_,i)=>({id:`audit_${i}`,name:i===36?'Last audit record':'Review <literal> item '+i,articles:1000-i,unused:'discard'}))
const rows=validatedRows(input)
check(!('unused' in rows[0])&&rows!==input&&rows[0]!==input[0],'copy fields')
for(const bad of [[{id:'Same',name:'ok',articles:1},{id:'same',name:'ok',articles:1}], [{id:'a',name:'bad\\0',articles:1}], [{id:'b',name:'ok',articles:1.5}]]){let refused=false;try{validatedRows(bad)}catch{refused=true}check(refused,'policy accepted invalid')}
const blob=await pdf(<ReportDocument title="Independent 37 row audit" rows={rows}/>).toBlob()
check(blob.type==='application/pdf','MIME')
const bytes=new Uint8Array(await blob.arrayBuffer());check(new TextDecoder().decode(bytes.slice(0,5))==='%PDF-','header')
const task=getDocument({data:bytes.slice()})
try{const doc=await task.promise;let text='';for(let i=1;i<=doc.numPages;i++)text+=(await(await doc.getPage(i)).getTextContent()).items.map(x=>'str'in x?x.str:'').join(' ')
for(const value of ['Independent 37 row audit','Review <literal> item 0','Last audit record','964'])check(text.includes(value),'missing '+value)
console.log(JSON.stringify({renderer:'4.9.0',newRows:rows.length,blobType:blob.type,bytes:bytes.length,parsedPages:doc.numPages,title:true,literalAngleBrackets:true,lastRow:true,policyRejects:3,copiedFields:true,scope:'Node renderer + Node PDF.js parse; no browser/visual'},null,2))}finally{await task.destroy()}
''')
(tmp/'tsconfig.json').write_text(json.dumps({'compilerOptions':{'strict':True,'target':'ES2022','module':'ESNext','moduleResolution':'Bundler','jsx':'react-jsx','skipLibCheck':True,'types':[],'lib':['ES2022','DOM'],'outDir':'out','rootDir':'src','allowJs':True},'include':['src/**/*']},indent=2))
argv=['pnpm','--filter','@reactloom/library-lab','exec','tsc','-p',str(tmp/'tsconfig.json')];r=subprocess.run(argv,cwd=root,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT);print(json.dumps({'cwd':str(root),'argv':argv,'exitCode':r.returncode,'output':r.stdout},ensure_ascii=False))
if r.returncode==0:
 shutil.copy2(src/'report-policy.mjs',tmp/'out/report-policy.mjs')
 for f in (tmp/'out').glob('*.js'):f.write_text(f.read_text().replace("from './report'","from './report.js'"))
 argv=['node',str(tmp/'out/consumer.js')];r=subprocess.run(argv,cwd=root,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT);print(json.dumps({'cwd':str(root),'argv':argv,'exitCode':r.returncode,'output':r.stdout},ensure_ascii=False))
print('temporary project:',tmp);shutil.rmtree(tmp)
```

## 官方独立核对

实装绝对package路径：`/home/lambert/githubRepos/lambert/ReactLoom/node_modules/.pnpm/@react-pdf+renderer@4.9.0_react@19.3.0/node_modules/@react-pdf/renderer/package.json`。原始关键字段：name=`@react-pdf/renderer`、version=`4.9.0`、license=`MIT`、main=`./lib/react-pdf.js`、browser={`./lib/react-pdf.js`:`./lib/react-pdf.browser.js`}。

固定仓库diegomura/react-pdf、commit `2c0b6d4a5d9db397d8cf5de4215e43b08ad5a7ca`：

- [包README](https://github.com/diegomura/react-pdf/blob/2c0b6d4a5d9db397d8cf5de4215e43b08ad5a7ca/packages/renderer/README.md)：独立urllib GET exit0，3559bytes，SHA256 `aecadb67037f5405f666c4d4f52456404a87a279f098c37fd6f8c79bed5f59d0`，sameBytes=True。官方tree记录无中文候选，en保留合理。
- [LICENSE](https://github.com/diegomura/react-pdf/blob/2c0b6d4a5d9db397d8cf5de4215e43b08ad5a7ca/LICENSE)：独立GET exit0，1109bytes，SHA256 `0c96b643c00775e094e8daf2de5707013d740621b735b0e4ceb9fab7698ca2e4`，与official/license.txt sameBytes=True；原文开头`MIT License`，版权2017-present Diego Muracciole。
- 独立urllib GET `https://react-pdf.org/` exit0，status200、finalUrl同址、X-Frame-Options=null、Content-Security-Policy=null。没有宿主iframe验收，不能从200宣称allowed；metadata保持unknown正确。

## 交棒与限制

无须作者整改。主控继续真实浏览器下载/URL生命周期及实际PDF逐页渲染确认页脚/裁切；本报告不预支其结果。中文字体许可与字形、任意title/长文本、巨量文档性能、可访问PDF标签/iOS/打印均不在本轮通过范围。报告完成，停写。
