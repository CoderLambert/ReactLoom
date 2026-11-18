# F02 独立复核（2026-11-18）

独立非作者只读，唯一写此报告。从catalog F02身份进入library/agent/guide/verification/local-validation，再读实际五文件与实装react-dropzone20.1.4 src/index.tsx。没有修改entry/shared，没有重跑作者policy8、shared或browser，没有实例化Hook却声称SDK成功。

**Spec：源码与迁入PASS；Quality：源码/说明/材料通过，实际DOM SDK与浏览器NOT_RUN待主控闭环。无阻断问题。** 适合选择/拖放/UX限制与小预览；上传、CSV结构解析、格式安全不属于本例。

| 六项 | 独立状态 | 依据 |
| --- | --- | --- |
| 技术准确 | PASS源码；SDK NOT_RUN | 20.1.4实际getter/keyboard/cancel/cleanup与UTF8策略匹配，见行号 |
| 解释清楚 | PASS | noClick不等noKeyboard、8KiB与1600UTF16单位、有损preview非strict验证、代次非取消明确 |
| Demo有用 | NOT_RUN DOM | 选择拒绝、首文件预览、两文件/迟到读取三个实际目标；浏览器交主控 |
| 可迁入 | PASS | 五原件+新Reactconsumer严格复制编译exit0，无宿主依赖/Provider/env/CSS；复用现有安装 |
| 官方材料 | PASS | 固定README/LICENSE重新HTTPS逐字节同一，实际包MIT/版本，官网未知状态合理 |
| 结果可复核 | 本地PASS；DOM NOT_RUN | 下列真实argv/cwd/exit/output；SDK0，新纯策略consumer1，不混计作者8项 |

## 真实SDK源码与接线

`packages/library-lab/node_modules/react-dropzone/src/index.tsx`：255–260 useFsAccessApi=false/noKeyboard=false默认；896–909根自身Enter/Space调用openFileDialog；921–934 noClick只使click回调早退，940–942键盘另由noKeyboard控制。本例role=button根通过getRootProps，input完整getInputProps；外置原生button调用open，未嵌套根；附加属性走getter，未覆盖库处理器。

877–881传统input每次open清value后click，onFileDialogOpen只说明请求；341–360窗口focus后300ms检查input files，取消是启发式且文档准确，不宣称可靠每平台取消。卸载解绑window focus，document drag事件effect返回removeEventListener；331–334中止内部文件提取/验证run，749–766 async提取检查signal。不能把它套称本例Blob.arrayBuffer物理取消，也不宣称所有SDK定时器同步清零。

实际limits：basic/business一个≤256KiB，advanced两个各≤1KiB，accept MIME+扩展名只是UX。onDrop只映射accepted，显示rejection code并可部分接收；advanced只预览第一个。单调nextId每次接受递增，当前快照同名同size不撞React key；clear不重置计数，keyed level重建可以从0再起，因为旧树已销毁，不是持久ID或去重。

## 自建预览与所有权

先slice(0,8192)再arrayBuffer，不读整File后截断。TextDecoder UTF8 stream:true无flush，未完成尾字节留buffer被丢弃，内部坏字节可U+FFFD，不是fatal编码检查。随后slice(0,1600)UTF16，最后高代理项丢弃，不拆合法emoji；不是1600码点/字素簇。只React文本，不HTML/CSV执行，无外网/路径/对象URL。

UI共有session read/invalidate；每新drop先失效旧值、read新代次，clear/level重建/unmount使旧完成与旧错误不能写。新策略消费者专门用迟到reject（非作者成功完成用例重复）验证失效后不调用reject，再恢复下一真实Blob读取。它是应用所有权策略，不是useDropzone或原生选择器SDK运行。

## 最小迁入与独立输入

五文件：example.tsx, preview.mjs, preview.d.mts, preview-session.mjs, preview-session.d.mts. 新consumer：

```tsx
import Drop from "./example";export const consumer=[<Drop key="a" level="business"/>,<Drop key="b" level="advanced"/>];

```

严格配置：
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": [
      "ES2022",
      "DOM"
    ],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": [
      "react",
      "react-dom"
    ]
  },
  "include": [
    "*.tsx",
    "*.mts"
  ]
}
```

新策略输入源码（Node原生Blob/TextDecoder；仅拒绝Promise替身用于明确迟到错误顺序，不冒称物理I/O或SDK）：
```js
import assert from 'node:assert/strict'
import {readLocalTextPreview} from './preview.mjs'
import {createPreviewSession} from './preview-session.mjs'
assert.equal(await readLocalTextPreview(new Blob([new Uint8Array([97,0xe2,0x82])])), 'a')
assert.equal(await readLocalTextPreview(new Blob([new Uint8Array([0xe2,0x28,0xa1])])), '\ufffd(\ufffd')
const prefix='😀'.repeat(799)+'x'
assert.equal(await readLocalTextPreview(new Blob([prefix+'😀tail'])),prefix)
assert.equal(await readLocalTextPreview(new Blob([])),'')
const session=createPreviewSession(), writes=[]
const blob=new Blob(['actual'])
let rejectRead
const rejected=new Promise((_,reject)=>{rejectRead=reject})
blob.slice=()=>({arrayBuffer:()=>rejected})
const pending=session.read(blob,text=>writes.push(text),error=>writes.push(String(error)))
session.invalidate();rejectRead(Error('late failure'));await pending
assert.deepEqual(writes,[])
await session.read(new Blob(['next']),text=>writes.push(text),error=>{throw error})
assert.deepEqual(writes,['next'])
console.log(JSON.stringify({layer:'PURE_POLICY_NOT_DROPZONE_SDK',incompleteTail:'dropped',interiorReplacement:true,utf16Length:prefix.length,staleFailureWrites:0,recovery:writes}))

```

真实命令输出：
```json
[
  {
    "cwd": "/home/lambert/githubRepos/lambert/ReactLoom",
    "argv": [
      "pnpm",
      "exec",
      "tsc",
      "-p",
      "/tmp/f02-independent-5wn_v_j0/tsconfig.json"
    ],
    "exit": 0,
    "output": ""
  },
  {
    "cwd": "/home/lambert/githubRepos/lambert/ReactLoom",
    "argv": [
      "node",
      "/tmp/f02-independent-5wn_v_j0/trial.mjs"
    ],
    "exit": 0,
    "output": "{\"layer\":\"PURE_POLICY_NOT_DROPZONE_SDK\",\"incompleteTail\":\"dropped\",\"interiorReplacement\":true,\"utf16Length\":1599,\"staleFailureWrites\":0,\"recovery\":[\"next\"]}\n"
  }
]
```

只清理本次owned临时目录。既有node_modules软链不是fresh-install。未重跑作者8policy或浏览器；SDK执行0。

## 官方材料

```json
[
  {
    "url": "https://raw.githubusercontent.com/react-dropzone/react-dropzone/b9a3e10cee6b15b6850e240caac94be80f5c7e0d/README.md",
    "status": 200,
    "bytes": 31585,
    "sha256": "b8aa2f3ceea991b217baa826993f0478cef8e9cdf1bb067b780ae4278454c90a",
    "sameBytes": true
  },
  {
    "url": "https://raw.githubusercontent.com/react-dropzone/react-dropzone/b9a3e10cee6b15b6850e240caac94be80f5c7e0d/LICENSE",
    "status": 200,
    "bytes": 1082,
    "sha256": "7b93b62069ec28d00cc7cf3696b5d243ad9887517f8e709dce4811747f0e2dc2",
    "sameBytes": true
  }
]
```

README固定SHA与metadata吻合。固定tree证据只README.md、无中文，en回退合理；MIT原license与installed字段相符。source-evidence官网200未frame拒绝头但未Lab-originiframe确认，unknown正确，不能因CORS或200说allowed。

## 后续验收与限制

主控已适配root button与arrayBuffer探针；应验证真实按钮/根Enter或Space chooser、noClick点击不打开、DataTransfer drop限制codes及两同名无key警告、外层真实slice读取hold后新文件/clear/level/unmount再release无迟到内容，且无外网。当前本报告尚无对应browser运行日志，正式verification维持NOT_RUN。触摸/读屏/设备chooser cancel可靠性另验，不用模拟取消事件补PASS。

无需要本批修复的发现。一个可解释边界：空Blob预览成功得到空串，但UI以“暂无预览”显示；没有声称空文本有可区分成功状态，对当前目标不阻断。session不是终态dispose对象，invalidate后允许新read；UI卸载后SDK内部processing abort与组件不再发起read共同约束，不应把invalidate描述成永久关闭。


补充实际package字段命令：cwd同上，`node -e "const p=require('./packages/library-lab/node_modules/react-dropzone/package.json'); console.log(JSON.stringify({version:p.version,license:p.license,peerDependencies:p.peerDependencies}))"`，exit0，stdout `{"version":"20.1.4","license":"MIT","peerDependencies":{"@types/react":"*","react":">= 18"}}`。getter实际958–1055合并用户处理器、root tabIndex0与自有ref，input type=file/accept/multiple及onChange→onDropCb，匹配组件展开方式。


## 主控browser后delta核对（2026-11-18）

主控首次9/10，唯一失败为测试假设maxFiles超限整批拒绝；主控已修测试与guide/agent并保留candidate34/first-browser-artifacts红trace。独立读取实际dist/index.js:627–635确认：acceptedFilesLimit按multiple/maxFiles设限，acceptedFiles.splice(limit)仅将超额部分转为too-many-files rejections，因此advanced三个原本合法文件接受前2、拒第三。当前组件映射accepted并显示rejections，源码本身支持部分接受，无产品修复。此行为与Uppy F01数量超限整批拒绝不同，不能套用。此delta未重跑浏览器；主控最终定向重跑中，先前报告DOM NOT_RUN仅指独立作者未执行。
