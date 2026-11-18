# F07 react-pdf 独立复核（2026-11-18）

只写此报告，未改entry/shared；由catalog→library/agent/guide/verification/local-validation→实际六运行文件及installedSDK源码核对。作者policy4/shared/browser未重跑。新consumer严格复制编译及新纯策略执行，均不是Document/Page/Worker SDK运行。

**最终Spec PASS（源码/迁入）；Quality 两项边界已修复并delta通过，真实DOM仍NOT_RUN待主控。** 两项发现均已提前报主控，下方保留原红证据及最终delta；不是已测浏览器渲染失败。

| 六项 | 独立状态 | 证据 |
| --- | --- | --- |
| 技术准确 | PASS（两项delta已修复） | installedPage门控/CanvasDPR/Document复制与销毁核对，下列发现 |
| 解释清楚 | PASS（取消接线已修复） | 双轴预算、未配置字体资源、解析非沙箱、读取失效非物理abort明确 |
| Demo有用 | NOT_RUN DOM | 首屏/逐页文字/缩放损坏恢复真实源码齐，主控browser待执行 |
| 可迁入 | PASS（原子类红→绿） | 六原件+新consumer编译exit0；Buffer接受却共享副本独立断言exit1 |
| 官方材料 | PASS | 固定包README与MIT重取原字节同一，根README实为28byte目标字符串；版本/Worker匹配 |
| 可复核结果 | 本地记录PASS；SDK/browser NOT_RUN | 真实argv/cwd/exit/output如下，保留红断言，不混计作者4policy或SDK |

## 已提前报告的边界

1. createPdfWorkerPayload使用source instanceof Uint8Array接受Buffer子类，但source.slice()在Buffer返回共享view。独立Buffer.allocUnsafeSlow(4)填[37,80,68,70]得到与source相同buffer，freshcopy断言exit1。普通浏览器状态是plainUint8Array，且installed Document内部会再复制，因此不等于当前UI状态被Worker detach；仍违反该公开helper“接受Uint8Array并拥有独立副本”合同。最小建议new Uint8Array(source)或Uint8Array.from(source)，补子类策略。
2. 文档称“取消也失效旧read”，实际只有input onChange→onFile(undefined)会递增readTurn。原生picker取消通常发cancel不发change，组件没有click/cancel处理，因此新开picker后取消不能保证旧读取失效。建议在input onClick先失效旧read（本UI任何picker请求先失效）或将文案明确限于空change事件。所有真正onChange包含无效文件/空文件都在校验前递增，这部分正确。

## installedSDK与页面预算

实际react-pdf11.0.0/MIT依赖pdfjs-dist6.3.289，与根可解析pdfjs6.3.289/Apache2一致。worker URL本地?url导入并与Document/Page同模块绑定，迁入需Vite及vite/client和TextLayer.css，批注关闭。 import是构建接线，不证明Worker运行。

Page.js:81–120 onLoadSuccess从已加载真实Page及scale发出，effect依赖[page,scale]；切换scale再次计算同一实际viewport不会无界循环（scale相同不再触发）。185–196 renderMode none确实不挂Canvas；初始geometry null且renderTextLayer false，因此先拿真实getViewport再按两轴fit后挂图层，而非先分配巨大Canvas再缩小。

Canvas.js:47–61实际renderViewport按scale×devicePixelRatio，canvas.width/height来自它；固定DPR1与ceil预算匹配。75–83任务cleanup cancel，92–93卸载清canvas尺寸。Document.js:91–105复制ArrayBuffer或view为新Uint8Array再getDocument，123 task.destroy由resource dispose；不能仅从DOM卸载推Worker terminate，须主控page.workers/关闭观察。

六原件完整：example.tsx、fixture.ts、worker-payload.mjs/.d.mts、render-budget.mjs/.d.mts，demo可省。file memo随bytes/generation更新，恢复相同fixture仍新payload；keyedlevel重建，document/page/zoom另key重做几何。所有新选择先readTurn，超限/无效保留旧document；reset/损坏/unmount失效旧arrayBuffer成功与错误，不声称取消原生I/O。

双轴min(720zoom/width,960zoom/height)，最大zoom1.5→1080×1440/1555200像素。新输入极宽/极高/16:9验证上下两轴，tiny拟合可见尺寸1px也合理；这不约束PDF解析CPU/字体内存/对象树，未配password/CMap/standardFont/WASM已明确，非任意敌对PDF安全沙箱。损坏→reset换key的恢复源码合理，真实浏览器仍待验。

## 新consumer与实际命令

新Reactconsumer：
```tsx
import Viewer from "./example";export const consumer=<Viewer level="advanced"/>;

```
严格配置：
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "noEmit": true,
    "skipLibCheck": true,
    "types": [
      "react",
      "react-dom",
      "vite/client"
    ],
    "lib": [
      "ES2022",
      "DOM"
    ]
  },
  "include": [
    "*.tsx",
    "*.ts",
    "*.mts"
  ]
}
```
新策略（非SDK）：
```js
import assert from 'node:assert/strict'
import {createPdfWorkerPayload} from './worker-payload.mjs'
import {getPageGeometry} from './render-budget.mjs'
const samples=[{width:1e9,height:3},{width:3,height:1e9},{width:3840,height:2160}]
const geometries=samples.map(v=>getPageGeometry(v,1.5))
for(const g of geometries)assert.ok(g.width<=1080&&g.height<=1440&&g.width*g.height<=1555200)
assert.deepEqual(getPageGeometry({width:720,height:960},0.75),{scale:0.75,width:540,height:720})
const owned=new Uint8Array([91,37,80,68,70,93]),subset=owned.subarray(1,5)
const p=createPdfWorkerPayload(subset);assert.equal(p.data.length,4)
p.data[0]=0;assert.equal(subset[0],37)
const transferred=structuredClone(p.data,{transfer:[p.data.buffer]});assert.equal(p.data.byteLength,0);assert.equal(transferred[1],80)
assert.equal(owned.byteLength,6)
assert.equal(createPdfWorkerPayload(subset).data[0],37)
console.log(JSON.stringify({layer:'PURE_POLICY_NOT_REACT_PDF_SDK',geometries,subsetCopyAndTransfer:true}))

```
子类合同红输入：
```js
import assert from 'node:assert/strict';import {createPdfWorkerPayload} from './worker-payload.mjs';const source=Buffer.allocUnsafeSlow(4);source.set([37,80,68,70]);const result=createPdfWorkerPayload(source);assert.notEqual(result.data.buffer,source.buffer,'accepted Uint8Array subclass must own a copy');console.log('Buffer subclass owns independent bytes');

```
原始执行：
```json
[
  {
    "cwd": "/home/lambert/githubRepos/lambert/ReactLoom",
    "argv": [
      "pnpm",
      "exec",
      "tsc",
      "-p",
      "/tmp/f07-independent-b_zgnk7k/tsconfig.json"
    ],
    "exit": 0,
    "output": ""
  },
  {
    "cwd": "/home/lambert/githubRepos/lambert/ReactLoom",
    "argv": [
      "node",
      "/tmp/f07-independent-b_zgnk7k/policy.mjs"
    ],
    "exit": 0,
    "output": "{\"layer\":\"PURE_POLICY_NOT_REACT_PDF_SDK\",\"geometries\":[{\"scale\":0.00000108,\"width\":1080,\"height\":1},{\"scale\":0.00000144,\"width\":1,\"height\":1440},{\"scale\":0.28125,\"width\":1080,\"height\":608}],\"subsetCopyAndTransfer\":true}\n"
  },
  {
    "cwd": "/home/lambert/githubRepos/lambert/ReactLoom",
    "argv": [
      "node",
      "/tmp/f07-independent-b_zgnk7k/buffer.mjs"
    ],
    "exit": 1,
    "output": "node:internal/modules/run_main:111\n    triggerUncaughtException(\n    ^\n\nAssertionError [ERR_ASSERTION]: accepted Uint8Array subclass must own a copy\n    at file:///tmp/f07-independent-b_zgnk7k/buffer.mjs:1:217\n    at ModuleJob.run (node:internal/modules/esm/module_job:569:25)\n    at async node:internal/modules/esm/loader:650:26\n    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:105:5) {\n  generatedMessage: false,\n  code: 'ERR_ASSERTION',\n  actual: ArrayBuffer { [Uint8Contents]: <25 50 44 46>, [byteLength]: 4 },\n  expected: ArrayBuffer { [Uint8Contents]: <25 50 44 46>, [byteLength]: 4 },\n  operator: 'notStrictEqual',\n  diff: 'simple'\n}\n\nNode.js v26.13.1\n"
  }
]
```

仅ownedtmp复制现有依赖，不称freshinstall。SDK执行0；新policy命令1PASS、helper子类合同命令1FAIL；strict1PASS。未跑作者policy4或browser。

## 官方来源重新核对

```json
[
  {
    "url": "https://raw.githubusercontent.com/wojtekmaj/react-pdf/ca2330bcb862dc27aa39849c74657ccf28c4e13f/packages/react-pdf/README.md",
    "status": 200,
    "bytes": 75199,
    "sha256": "c9c087e5e45eb03a027cbac74c480069b233455df5763e6b7b201be94d692ef1",
    "sameBytes": true,
    "symlinkTarget": null
  },
  {
    "url": "https://raw.githubusercontent.com/wojtekmaj/react-pdf/ca2330bcb862dc27aa39849c74657ccf28c4e13f/LICENSE",
    "status": 200,
    "bytes": 1076,
    "sha256": "c205058a880f412b34d1c660ea2889d86876b3a2a3c77cedf5996e674b2e24f7",
    "sameBytes": true,
    "symlinkTarget": null
  },
  {
    "url": "https://raw.githubusercontent.com/wojtekmaj/react-pdf/ca2330bcb862dc27aa39849c74657ccf28c4e13f/README.md",
    "status": 200,
    "bytes": 28,
    "sha256": "e63c5d1fc98ea2425944b601f8a7ad942f6a742be2422a3717fdadc4c0a071b0",
    "sameBytes": null,
    "symlinkTarget": "packages/react-pdf/README.md"
  }
]
```

包README75199bytes SHA匹配metadata；根README实际28bytes指向packages/react-pdf/README.md，未把symlink文字冒充README。固定tree仅包英文README，en合理；LICENSE1076bytesMIT与实装字段一致。首页实际GET200但没有Lab-originiframe成功，unknown正确；官网不是demo资源，不借此证明本地PDF运行。

实际版本字段probe cwd仓库根，`node -e "const a=require('./packages/library-lab/node_modules/react-pdf/package.json'),b=require('./packages/library-lab/node_modules/pdfjs-dist/package.json');console.log(JSON.stringify({reactPdf:a.version,license:a.license,requiredPdfjs:a.dependencies['pdfjs-dist'],pdfjs:b.version,pdfjsLicense:b.license}))"` exit0，stdout `{"reactPdf":"11.0.0","license":"MIT","requiredPdfjs":"6.3.289","pdfjs":"6.3.289","pdfjsLicense":"Apache-2.0"}`。

主控后续真实Canvas/textLayer/Workerterminate/巨大MediaBox/DPR2/损坏恢复与迟到读取矩阵须匹配候选运行日志。当前formal三NOT_RUN不提升。上述两边界修正后只需delta消费者/源码核对，无需重跑作者整套或重复共享检查。


## 最终delta复核（作者再次STABLE后）

作者仅改helper为new Uint8Array(source)，input type=file新增onClick同步readTurn++，guide/agent写明新picker请求先失效，不依赖cancel触发change。独立读取实际字段确认click处理位于onChange之前；这是本UI原生输入请求路径，不伪称所有程序showPicker或物理I/O取消。作者新增Buffer回归red/green另存日志，未由本复核重跑作者整套。

独立仅复制更新后的worker-payload.mjs与example.tsx进入原ownedtmp：**同一个先前红Buffer输入现在exit0**；六文件consumer严格编译再次exit0。原几何/普通subarray试验没改相关代码，不重复；原红输出上面保留。

```json
[
  {
    "cwd": "/home/lambert/githubRepos/lambert/ReactLoom",
    "argv": [
      "node",
      "/tmp/f07-independent-b_zgnk7k/buffer.mjs"
    ],
    "exit": 0,
    "output": "Buffer subclass owns independent bytes\n"
  },
  {
    "cwd": "/home/lambert/githubRepos/lambert/ReactLoom",
    "argv": [
      "pnpm",
      "exec",
      "tsc",
      "-p",
      "/tmp/f07-independent-b_zgnk7k/tsconfig.json"
    ],
    "exit": 0,
    "output": ""
  }
]
```

最终无阻断问题，公开helper迁入合同和取消表述均闭环。Node检查仍纯policy/编译，实际react-pdf SDK执行0；浏览器Worker/Canvas/图层与生命周期、正式receipt继续由主控执行，不从本delta变更为PASS。原初六维表中红条目是历史触发原因，最终结论以上段为准。所有本次ownedtmp与临时记录定向删除。


## suspense=false 源码delta独立复核（2026-11-18）

只读本次delta，不跑共享/浏览器或作者policy。实际example.tsx:25的Page、191的Document均显式suspense={false}。匹配installed11.0.0支持的公开prop：Document.js:113默认true，115/126传给useResource，123的dispose仍指向loadingTask.destroy；Page.js:36/44同样传false，150经上下文传Canvas/文字层。几何none→canvas门控与DPR1未删除。

实装shared/hooks/useResource.js:7在false时给useSuspenseResource(undefined)，因此没有resource/use(resource.promise)悬停；13–46走effect loader，active守卫抑制迟到resolve/reject，cleanup active=false后异步调用task.dispose并RESET。useSuspenseResource.js确实在资源存在时使用React use(resource.promise)，以cache/key身份持有资源；false路径绕开该读取分支，同时保留加载与错误状态。Canvas仍由Page上下文false及自身effect管理实际RenderTask.cancel，非模拟渲染。

主控报告candidate35首次真实browser停在宿主loading、import已resolve且Session反复进入；该现象是主控运行记录，本复核未重跑。源码支持此delta改走effect兼容路径，**静态接线PASS**；无法仅凭源码证明所有Suspense重试的唯一根因，也不预支修复后真实Worker/Canvas/文字层或terminate PASS。作者suspense-delta-types/biome记录exit0，本次不重复；最终浏览器由主控重建候选验证，formal NOT_RUN保持。
