# E19 ffmpeg.wasm 非作者独立迁入复核

结论：**迁入/局部Worker所有权与修复后输入边界通过；真实WASM转换和浏览器验收由主控负责，本报告不预支。** 发现一项实质输入白名单缺陷，已立即报主控并由并行修改关闭，证据保留。只写本报告；没有暂存/复制/传输core、修改门禁/依赖/条目、共享生成构建/浏览器或重复既有策略套件。

任务前提：本次用户已同意许可复核及仅本机暂存验收。entry先前文档仍记“未授权/资源缺失/完整BLOCKED”，本复核保留它作为历史检查点，不当成能覆盖当前用户授权的新阻断。许可/分发结论不由本报告替维护者决定；主控验收结束须同步当前事实与正式receipt状态，不能以新局部编译结果擅自升sdk PASS。

## 六维分层

| 维度 | 本次范围和状态 |
| --- | --- |
| 技术准确 | PASS类型/源码：固定wrapper0.12.15/core0.12.10区分，0.12类API、single-thread core仍有wrapper Worker、signal非物理中断、terminate实际终止合同均匹配实装。真实转换NOT_RUN于本复核。 |
| 解释清楚 | PASS源码/迁入说明；阶段文案待主控同步：目标16k mono PCM16，-t上限不延长输入，签名不等安全、Node导出不支持转换清楚。旧未授权BLOCKED应与当前授权/主控新证据区分。 |
| Demo有用 | 源码三个不同目标成立：原创路径/本地标准化/0.5s+取消重建；运行/输出/转换中取消由主控，未以UI壳或policy计SDK。 |
| 完整迁入 | PASS严格复制：七运行文件含两mjs声明和CSS，三个level consumer及新SDK参数均strict compile exit0。demo为转发可省；核心合法部署仍是外部前提，无隐式下载。 |
| 官方可靠 | 复用有效固定来源：tag v12.15/commit71aa99…英文根README2161B及两包字段/许可区分，官网200无XFO/CSP但COOP/COEP不保证iframe；unknown合理。未重取/暂存核心。 |
| 可复核结果 | PASS本地分层：新严格编译、新输入/预算pure helper、实装Worker静态审计；既有policy9及来源复用、不重复。真实SDK/browser主控，formal原状态不在本报告提升。 |

## 已发现并关闭：MIME白名单原型链绕过

初次只读实际input-policy.mjs中MIME_EXTENSION为普通Object.freeze对象，isAllowedMediaFile用`MIME_EXTENSION[file?.type]`真值判断，没有own-key限制。type='constructor'/'__proto__'会命中继承属性，validateInputMedia对非wav/mp3/webm分支统一isMp4，ftyp字节可使其返回function/object而不是声明中的扩展名，破坏已知MIME与固定虚拟路径合同。立即通知主控，未自行修改entry。

在新consumer运行前，主控并行已修为typeof string + Object.hasOwn(MIME_EXTENSION,file.type)。因此第一次未catch的负面consumer现场exit1是新代码正确拒绝，**不是记录成旧漏洞已成功动态复现**。原始静态发现来自修改前实际源读取，关闭依据为修改后实际负面输入。

最终Node consumer使用真实File（12bytes，offset4='ftyp'，name independent.mp4，分别type constructor/__proto__），得到：

```json
{"type":"constructor","allowed":false,"refused":true}
{"type":"__proto__","allowed":false,"refused":true}
```

断言allowed=false、validateInputMedia必须抛，exit0。这个修复不涉及SDK。补新输出参数：makeToneWav截为12044bytes，RIFF长度与data长度12000同步，形成0.375s原创PCM；inspectPcmWav(bytes,65536,0.4)通过，0.25s拒绝，输出：

```json
{"newOutput":{"bytes":12044,"sampleRate":16000,"channels":1,"seconds":0.375},"shorterRefused":true,"scope":"pure helper, not FFmpeg SDK"}
```

这是新pure helper consumer，不是FFmpeg解码/转码通过；没有重跑原policy9套件。cwd repo root，argv `node --input-type=module -`，exit0。

## 新最小迁入consumer与精确编译

ownedtmp复制七实际运行源：example.tsx、wav.ts、input-policy.mjs/.d.mts、wav-output-policy.mjs/.d.mts、workshop.css，node_modules只链接已安装Lab。配置strict/noEmit/ES2022/ESNext/Bundler/react-jsx/DOM/vite-client；skipLibCheck仅跳第三方声明。没有构造Node FFmpeg或执行typedPlan，不下载/读取core。

实际命令/输出：

```json
{
  "cwd": "/home/lambert/githubRepos/lambert/ReactLoom",
  "argv": [
    "pnpm",
    "--filter",
    "@reactloom/library-lab",
    "exec",
    "tsc",
    "-p",
    "/tmp/e19-independent-9ozu00vk/tsconfig.json"
  ],
  "exitCode": 0,
  "stdout": "",
  "copied": [
    "example.tsx",
    "wav.ts",
    "input-policy.mjs",
    "input-policy.d.mts",
    "wav-output-policy.mjs",
    "wav-output-policy.d.mts",
    "workshop.css"
  ]
}
```

新consumer原件如下；三个level消费、新0.375秒/7500ms/64KiB预算及显式本地URL用于核对固定SDK类型，不意味着这些新参数已执行转换：

```tsx
import type {FFmpeg} from '@ffmpeg/ffmpeg'
import View from './example'
import {isAllowedMediaFile,validateInputMedia} from './input-policy.mjs'
import {inspectPcmWav} from './wav-output-policy.mjs'
export const examples=[<View level="basic"/>,<View level="business"/>,<View level="advanced"/>]
export async function typedPlan(engine:FFmpeg,bytes:Uint8Array,signal:AbortSignal){
 const accepted=validateInputMedia({type:'audio/wav',size:bytes.byteLength},bytes)
 if(!isAllowedMediaFile({type:'audio/wav',size:bytes.length}))throw Error('input')
 await engine.load({coreURL:'/review-local/ffmpeg-core.js',wasmURL:'/review-local/ffmpeg-core.wasm'},{signal})
 await engine.writeFile(`audit.${accepted}`,bytes)
 const code=await engine.exec(['-i',`audit.${accepted}`,'-vn','-ac','1','-ar','16000','-c:a','pcm_s16le','-t','0.375','-f','wav','audit-output.wav'],7500,{signal})
 const output=await engine.readFile('audit-output.wav')
 if(code!==0||typeof output==='string')throw Error('output')
 return inspectPcmWav(output,65536,0.4)
}

```

外层cwd `/home/lambert/githubRepos/lambert/ReactLoom`，`python3 /tmp/e19-independent.py`成功，临时项目已删除。复制源码与类型完整，不是仅编译另写的假接口；Vite/client负责BASE_URL和CSS，迁出需Vite浏览器环境与获准同源core部署。advanced sourceFiles额外列两policy.test是可选审计材料，不是必需运行源。

## 固定包装器实际Worker合同与局部所有权

只读取@ffmpeg/ffmpeg/dist/esm源码/类型，没有运行core：

- package node export→empty.mjs，不能Node壳假造SDK转换。classes.d.ts的load(options,{signal})、exec(args,timeout,{signal})、writeFile/readFile返回值与consumer一致。
- classes.js:102–118 load创建模块Worker（默认./worker.js）并发送LOAD；worker.js显式coreURL/wasmURL覆盖默认远端，组件确实两项都给BASE_URL同源资源，未用CDN/toBlobURL。
- classes.js:65–78 #send将信号abort仅接reject，未向Worker发送中断FFmpeg执行消息。worker.js exec为setTimeout(timeout)→ffmpeg.exec(...args)→ret→reset，因此组件不能把AbortError当计算终止。
- classes.js:186–199 terminate拒绝全部未完成resolves/rejects，调用真实Worker.terminate，worker=null且loaded=false；组件取消后要求重load，与SDK一致。不声称terminate清空别的页面或全局缓存。
- 组件operation在await前同步占用，固定input/output虚拟路径单飞。session与ffmpeg实例身份在读取/write/exec/read后检查；旧错误只在当前session写状态，旧finally只删捕获实例文件，仅operation===id才解锁/更新cleanup，不能解锁新实例操作。
- load候选失败销毁捕获candidate，清engine前核身份；过期load只终止旧候选，不能终止新engine。log回调核当前实例，旧实例日志不写新场景。level effect cleanup/unmount增session、清operation、terminate并revoke自有输出URL。
- 转换起始清旧输出；成功read后解析WAV再创建URL；取消/切level/卸载只回收自己的URL。SDK Worker终止后的deleteFile reject被finally捕获，删除计数只累计真实成功，不宣称已销毁FS仍成功逐文件删除。

未见新的局部生命周期阻断。上述为实装源码审计，不是浏览器Worker构造/terminate、取消中exec或迟到结果的现场证明。主控需继续实际浏览器观察；没有用DOM消失冒称Worker已终止。SDK本身signal listener行为不由本条重写，本例没有传signal冒称它能终止循环。

## 来源复用与交棒

复用entry官方固定README/两包版本/许可证与既有policy/类型记录，不因本次许可授权而擅自获取core或改源码门禁。wrapper MIT不能替代core GPL-2.0-or-later声明，官方首页COOP/COEP也不保证Lab iframe；unknown保留。

需主控在新实际验收完成后同步agent/guide/library/verification/local-validation的旧未授权与资源缺失历史表述，区分过去BLOCKED、当前已授权本机暂存和实际执行结果。正式sdk/build/browser只按其匹配receipt更新。本报告不负责该写入，也不把历史文本当永久授权禁令。

本复核完成，停写。剩余真实SDK、输出文件与浏览器生命周期由主控独立负责。

控制者补充确认：own-key delta已STABLE；其独立真实Node File回归有先红后绿，证据标识`candidate-38/mime-regression-red.txt`和`policy.txt`（10项），本报告不替代或重计该主控套件。本人修改后新consumer拒绝两原型键，与该回归一致；此项关闭。浏览器constructor文件读取前拒绝仍由主控执行。
