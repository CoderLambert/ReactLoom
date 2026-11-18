# F06 PDF.js 非作者独立复核

结论：**Spec PASS（静态及独立 Node 范围）；六项质量按证据分层，无实质阻断发现。真实浏览器 Worker/Canvas/terminate 尚待主控，不能由此报告推定通过。** 作者已STABLE；本次只写本报告，不改条目/共享文件，不跑作者整套或共享检查。

## 六项

| 维度 | 状态 | 独立证据 |
| --- | --- | --- |
| 技术准确 | PASS 静态+真实Node解析 | 同版6.3.289；新一页PDF实际getDocument/getPage/getTextContent，真实viewport进入共用budget；与policy分别记。 |
| 解释清楚 | PASS 文档 | 当前catalog/agent/guide把阅读/生成/OCR、候选保留/预算失败清空、accepted/pending/probe和gate职责分开。 |
| Demo有用 | NOT_RUN 浏览器 | 三目标为原生Canvas、分页文字、候选恢复/HiDPI；主控运行实际Worker和Canvas。Node不证明可见绘制。 |
| 源码可迁移 | PASS strict | 六实际原件完整复制编译，strict/Bundler/react-jsx/DOM/vite-client，exit0。无共享或全局typecheck。 |
| 官方可靠 | PASS 原字节 | 当前官方snapshotPath已修为小写official/readme.md；重新GET固定1c8020a… README9219bytes SHA4e6c916…及LICENSE10174bytes，与保存原字节相同。Apache2及installed6.3.289字段对应。homepage实际200但无Lab-origin证据，unknown准确。 |
| 结果可复核 | PASS 本地证据；browser NOT_RUN | 下列真实argv/cwd/exit/output及完整重现脚本；不重复作者SDK2/policy9。正式verification各项NOT_RUN准确。 |

## 所有权与边界审计

- acceptedTask只在候选task.promise成功且token仍当前后替换；失败文档不覆盖旧pdf。旧accepted先cancelRender再destroy，新候选与probe在beginInput时销毁；finally仅清理自身引用，旧任务不能清掉新pending。WeakMap复用destroy promise，catch不谎称已释放。
- File在空/大小/后缀校验前beginInput，非法文件选择也作废此前pending读取和probe；卸载/切level递增generation并销毁三类任务。arrayBuffer物理读取未取消，正确只称忽略迟到。
- cancelRender将active置false并调用真实RenderTask.cancel；单Canvas绘制经过共用gate，等待旧任务settled（拒绝也不会污染下一次）。getPage/文字/排队绘制各有active判断。新绘制先清零旧Canvas再检查viewport/DPR，budget在非零背板分配前；失败排队清Canvas，旧文字先清空。
- 3MiB不是像素预算；真实双轴CSS4096、背板4096、8MP、DPR<=2分别生效。未配置字体/CMap/WASM/密码，不能推广通用PDF兼容性。
- `acceptBytes`私有source.slice调用方均为本条目原创Uint8Array或new Uint8Array(File.arrayBuffer)，不是接受任意Buffer的公共helper，因此未重现F07的Buffer子类问题。
- 精确边界：当前文件input没有onClick失效，取消picker不承诺终止此前读取；loadLocalFile(undefined)直接返回。guide只承诺“File选择/非法文件”，没有把取消称已覆盖。若产品需“打开picker即作废旧输入”，可同F07增加onClick，但不据此宣称本条目取消已验证。

## 新消费者的真实结果

cwd `/home/lambert/githubRepos/lambert/ReactLoom`。

1. `node packages/library-lab/scripts/find-library.mjs --id F06 --json`，exit0（当前小写snapshot入口）。
2. `pnpm --filter @reactloom/library-lab exec tsc -p /tmp/f06-independent-jz9a1lu_/tsconfig.json`，exit0，stdout/stderr空。
3. `node /tmp/f06-independent-jz9a1lu_/consumer.mjs`，exit0：

```text
SDK: new PDF 1 page; Orion Independent 42; actual viewport => 800x500
POLICY: queued operation waits rejected predecessor; 16MP and huge CSS rejected
Warning: UnknownErrorException: Ensure that the `standardFontDataUrl` API parameter is provided.
```

SDK为Node legacy同版本真实解析/文字，不是浏览器Worker/Canvas。新PDF为独立320×200一页，内容Orion Independent 42；scale2、DPR1.25实际viewport预算800×500。policy是独立held gate在拒绝后才开始下一操作、16MP与5000宽CSS拒绝，不是SDK绘制。警告原样保留。临时副本仅本次创建并已删除，重现脚本如下。

4. Python urllib固定GET README/LICENSE字节比较，exit0：

```text
README 9219 4e6c916c503937ee7fc46242691d61836e0ebb4f1a5e9e5e1207006d3737b705 LICENSE 10174 original bytes MATCH
```

README `https://raw.githubusercontent.com/mozilla/pdf.js/1c8020a7d4e43668ac287a3ecf9a8dbea17e4c56/README.md`；同ref `/LICENSE`。未运行共享browser、build/generate或作者套件。主控应独立观察实际Worker逐实例终止、成功候选替换/坏候选保留、巨大MediaBox拒绝和旧画面清空、快速缩放串行、迟到读取/level卸载。

## 独立重现脚本

以下Python保存为任意临时文件，在上述cwd执行；脚本复制六原件、运行strict和全新consumer并仅清理自己的临时目录。

```python
import pathlib,tempfile,shutil,json,subprocess
root=pathlib.Path.cwd();src=root/'packages/library-lab/entries/F06-pdfjs/examples';tmp=pathlib.Path(tempfile.mkdtemp(prefix='f06-independent-',dir='/tmp'));(tmp/'node_modules').symlink_to(root/'packages/library-lab/node_modules')
for n in ['example.tsx','fixture.ts','render-budget.mjs','render-budget.d.mts','render-gate.mjs','render-gate.d.mts']:shutil.copy(src/n,tmp/n)
(tmp/'tsconfig.json').write_text(json.dumps({'compilerOptions':{'strict':True,'noEmit':True,'jsx':'react-jsx','target':'ES2022','module':'ESNext','moduleResolution':'Bundler','types':['vite/client'],'skipLibCheck':True},'include':['*.tsx','*.ts','*.mts']}))
(tmp/'consumer.mjs').write_text('''import assert from 'node:assert/strict';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {boundedCanvasSize} from './render-budget.mjs';
import {createRenderGate} from './render-gate.mjs';
const stream='BT /F1 13 Tf 30 150 Td (Orion Independent 42) Tj ET';
const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 320 200] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',`<< /Length ${stream.length} >>\\nstream\\n${stream}\\nendstream`,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
let s='%PDF-1.4\\n';const offsets=[];
for(const [i,o] of objects.entries()){offsets.push(s.length);s+=`${i+1} 0 obj\\n${o}\\nendobj\\n`}
const x=s.length;s+=`xref\\n0 6\\n0000000000 65535 f \\n${offsets.map(n=>String(n).padStart(10,'0')+' 00000 n \\n').join('')}trailer\\n<< /Size 6 /Root 1 0 R >>\\nstartxref\\n${x}\\n%%EOF\\n`;
const source=new TextEncoder().encode(s);const task=getDocument({data:source.slice()});
try {const pdf=await task.promise;assert.equal(pdf.numPages,1);const page=await pdf.getPage(1);const text=(await page.getTextContent()).items.map(x=>'str'in x?x.str:'').join('');assert.equal(text,'Orion Independent 42');const size=boundedCanvasSize(page.getViewport({scale:2}),1.25);assert.deepEqual(size,{pixelWidth:800,pixelHeight:500,cssWidth:640,cssHeight:400,ratio:1.25});console.log('SDK: new PDF 1 page; Orion Independent 42; actual viewport => 800x500');}finally{await task.destroy()}
assert.equal(source[0],37);
const gate=createRenderGate();let release;const held=new Promise(r=>release=r);const order=[];
const first=gate(async()=>{order.push('old:start');await held;order.push('old:settled');throw new Error('cancelled fixture')});
const caught=first.catch(()=>{});const second=gate(()=>order.push('new:start'));await Promise.resolve();assert.deepEqual(order,['old:start']);release();await Promise.all([caught,second]);assert.deepEqual(order,['old:start','old:settled','new:start']);
assert.throws(()=>boundedCanvasSize({width:2000,height:2000},2),/8MP/);assert.throws(()=>boundedCanvasSize({width:5000,height:3000},1),/4096/);
console.log('POLICY: queued operation waits rejected predecessor; 16MP and huge CSS rejected');
''')
for cmd in [f'pnpm --filter @reactloom/library-lab exec tsc -p {tmp}/tsconfig.json',f'node {tmp}/consumer.mjs']:
 r=subprocess.run(cmd,shell=True,text=True,capture_output=True);print(json.dumps({'cwd':str(root),'argv':cmd,'exit':r.returncode,'output':r.stdout+r.stderr},ensure_ascii=False))
shutil.rmtree(tmp)

```
