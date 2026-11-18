# E19 本机隔离验收（candidate-38）

E19 已通过本地六项质量验收。只对确认的 `@ffmpeg/core@0.12.10` ESM 资源临时开放本机 Vite 回环预览，测试后删除隔离目录。常规 `public` 和 `dist` 中均未留核心文件。

- 实际 Chromium 四个独立用例 4/4。真实 Worker 与核心请求、转换成功及拒绝、两种阶段取消/重建、卸载终止及对象 URL 回收都保留原始观察。截断且匹配签名的输入由真实解码器返回 1，恢复文件正常输出。
- 实测 `ffprobe` 对四份最终产物回读确认 16 kHz、单声道、PCM16，时长为 1 或 0.5 秒。12,000 ms 参数已观察，未单独触发长超时。
- 只读独立迁入验证通过。own-key 白名单修复真 File 回归先失败再通过，完整纯策略 10/10。Scoped Biome、TypeScript、生产构建与目录契约通过。

见[六项结果](../../../../openspec/roadmaps/upgrade-library-quality/results/E19.md)、[候选日志](../../../../docs/library-lab/evidence/quality-upgrade/candidate-38/results.json)。正式收据仍为 `NOT_RUN`。

下文为许可确认前的历史检查点，原失败与未运行状态保留。

---

# E19 ffmpeg.wasm 内容稳定与阻断记录

## 对象和范围

- cwd `/home/lambert/githubRepos/lambert/ReactLoom`，HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。接手时14文件，无本条目diff；entry-relative SHA-256 `f5156f4e644348f402f6bdc2dd1ef7b242b12bf3ffabf1c7448cf9815af062c8`，原始逐文件摘要见 [baseline](validation/baseline.json)。摘要不是Git提交。
- 先完成B13独立只读复核，再读E19全部材料、输入/输出政策和现有测试；主控candidate-05稳定后明确释放内容写入。沿用根/本包/条目AGENTS、协作/实施/整改文档与quality skill三references。
- 只写本条目；保留原取消、单飞、session+实例守卫、同源加载和终态清理。没有改公共src/scripts/e2e、依赖锁、生成索引、queue/results；不提交/推送/发布，不运行全目录generate/typecheck/build。
- 核心门禁明确保留：未设置许可已审标志；没有读取.env或凭据，没有复制/下载门禁核心，没有调用prepare-ffmpeg-core，没有尝试CDN替代，没有运行真实WASM转换。README/package.json/官网的公开文本取回不是核心资产取回。

## 已确认的精确BLOCKED

[resource-prerequisites.json](validation/resource-prerequisites.json) 是只读源码/包metadata/路径存在性观察：

1. 包装器已安装 `@ffmpeg/ffmpeg@0.12.15`，声明MIT；核心已安装 `@ffmpeg/core@0.12.10`，声明GPL-2.0-or-later。安装本身不构成再分发复核授权。
2. 当前 `packages/library-lab/public/ffmpeg-core` 不存在，转换需要的同源js/wasm未暂存。
3. 公共脚本 `scripts/prepare-ffmpeg-core.mjs` 默认仅在既有许可已审门槛满足后才暂存；未批准分支返回 `BLOCKED / GPL core redistribution requires explicit review`，且只清理由自身marker确认的生成目录。这是读取源码结论，**本轮没有执行该脚本或检查环境变量值**。
4. Node条件导出实际指向dist/esm/empty.mjs，其构造器明确拒绝Node；普通Node导入、SSR/UI壳或纯WAV检查都不能替代真实浏览器转码。

因此没有“转码命令退出码”或产物WAV可报告，真实load/write/exec/read/清理/取消均未运行。阻断依据已经明确，不为同一缺口反复点击或重试下载。

## 目标、增量实现和产物

三个原目标保留：basic用原创1秒纯音理解输入→虚拟FS→命令→输出；business增加本地文件预检和标准化；advanced增加0.5秒目标、超时和Worker销毁后重建。没有把三份标题不同的相同结果作为三个已验证成果。

- 正常排版全部examples，补独立作用域workshop.css与中文完整guide/agent。迁移文件、React浏览器/Vite前提、wrapper/core版本和单线程/包装器Worker关系明确。
- 实际命令和预览共用wavArguments；显式增加 `-c:a pcm_s16le`，不依赖WAV默认编码器来解释16位输出。exec仍12,000ms，非0失败，旧有效错误/超时边界保留。
- 新观察点来自真实操作事件：phase、读取输入快照、实际args、exec退出码、inspectPcmWav返回值、deleteFile成功次数。未执行时只显示参数预览和“尚未返回”，不填假产物。
- UI使用原同源WAV解析器，保留2MiB和16kHz/mono/PCM16限制，时长按当前场景2/0.5秒校验；新策略只核对0.5秒边界与下一PCM帧，原有效输入/chunk检查保留。
- 处理期间文件选择disabled，快照固定本次读取；audio+“下载本次WAV”只在真实输出校验后显示，链接使用自有Blob URL，不获取核心。保留单飞operation、await后的session/实例判断、finally对捕获实例清文件；旧finally不得解锁新操作。
- 取消按钮只在加载/就绪/转换有实例期间可用；terminate后未加载，继续必须reload。清理返回值只是本次真实调用结果；当前并未运行它们。换level/卸载继续terminate和revoke。

## 六项整体交付状态

按主控要求，许可/资源未解除时本条目完整六项均BLOCKED。表内同时区分已经完成的静态材料和仍缺的运行证据，不能把一项局部检查平均成总体PASS。

| 维度 | 状态 | 已有材料与当前缺口 |
| --- | --- | --- |
| 技术准确 | BLOCKED | 匹配版本wrapper源码/类型、核心license和固定提交包版本已核，9策略/入口类型有效；真实核心执行与0.5秒/PCM输出未获准验证 |
| 解释清楚 | BLOCKED | guide用途→模型→接入→3实验→迁移已写，说明预期/实际、wrapper/core、signal/terminate；完整教学结果尚不能与真实转码对照验收 |
| Demo有用 | BLOCKED | 3独立目标和真实SDK调用路径/观察点齐全；缺许可和同源核心，未操作真实输入/转换/播放/取消 |
| 源码可迁移 | BLOCKED | 正常排版、必要源码/类型/CSS全列sourceFiles，定向类型通过；迁入可运行还需要获准核心部署和目标环境Worker/WASM验证 |
| 官方来源可靠 | BLOCKED | README本身已成功固定取回、摘要/包版本/中文候选/完整官网头齐全；来源材料完成不等于核心再分发许可或整体功能获准，官网嵌入仍unknown |
| 结果可复核 | BLOCKED | 策略/类型/metadata/Biome的cwd/命令/exit/日志保存；没有真实SDK转码日志/WAV/Worker取消收据，浏览器提案未执行 |

不标content_done。正式verification为sdk BLOCKED，build/browser NOT_RUN；本轮局部PASS没有升级正式状态。

## 官方原文、版本和官网响应

真实上游tag是 `v12.15`，不是推测的v0.12.15；解引用commit `71aa99d37c02a7b4c435275ca9ef50e612f6efa1`。公开固定提交的packages/ffmpeg/package.json=0.12.15、packages/core/package.json=0.12.10，与当前两个锁定安装包分别匹配。完整recursive tree（truncated=false）共9份README候选，无官方中文，选择根README.md的英语原文。

- canonical sourceUrl：[固定提交README](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/71aa99d37c02a7b4c435275ca9ef50e612f6efa1/README.md)。实际raw GET200，2161字节，SHA-256 `c658a2af2da82d7b290f7ecb4ff38480594ade43eaed824094fad75bf385b68d`。快照 [official/readme.md](official/readme.md) 原始字节保留，包括维护者告示；不是自行翻译。同步时间以source-evidence.json/library.json为准。
- 完整原始响应头、最终URL、body摘要、两个匹配package.json内容和候选记录在 [source-evidence](official/source-evidence.json)。README原文没有包含完整核心许可文本，不把其MIT徽标扩展成核心许可声明。
- [官方Usage](https://ffmpegwasm.netlify.app/docs/getting-started/usage/) 与本地0.12.15 classes/types/worker源码核对：Vite使用ESM核心；load/exec/terminate和毫秒timeout匹配。源码的消息AbortSignal只拒绝等待，未终止FFmpeg循环；terminate拒绝所有未完成消息并调用Worker.terminate。
- 官网 `https://ffmpegwasm.netlify.app/` 本次GET200，最终URL相同；完整响应无XFO/CSP，有COOP same-origin、COEP require-corp。COOP/COEP不构成iframe允许证据；未从Lab origin做浏览器确认，metadata维持unknown，保留官网直达。
- FFmpeg官方通用命令手册一次抓取超时，未据此补造响应或循环请求；本轮新增参数仍待授权后的真实固定核心命令结果核对，不把文档或参数预览当执行产物。

## 实际定向命令与日志

执行cwd均为 `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`，除最后diff检查在仓库根。所有命令真实启动并直接保存stdout/stderr，argv、已捕获的UTC时间、退出码、输入和日志SHA在 [local-runs](validation/local-runs.json)。最初format的UTC起止未捕获，manifest明确保留该限制，没有事后推断时间或补跑。没有SDK转换命令执行。

| 实际命令 | exit/结果 | 原始日志 |
| --- | --- | --- |
| `pnpm exec -- biome format --write entries/E19-ffmpeg-wasm/examples` | 0；9文件正常格式整理 | [format.txt](validation/format.txt) |
| `pnpm exec -- biome check --write ...`（完整路径见manifest） | 首次1；15文件，修复6格式；媒体字幕规则1错误和URL模板建议保留原始输出 | [biome-initial.txt](validation/biome-initial.txt) |
| `node --test entries/E19-ffmpeg-wasm/examples/input-policy.test.mjs entries/E19-ffmpeg-wasm/examples/wav-output-policy.test.mjs` | 0；9 PASS，0 FAIL，全部纯策略，不是真FFmpeg SDK | [policy.txt](validation/policy.txt) |
| `pnpm exec -- tsc --ignoreConfig --noEmit --target ES2022 --lib ES2022,DOM,DOM.Iterable --module ESNext --moduleResolution Bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --allowSyntheticDefaultImports --allowImportingTsExtensions --types vite/client,node entries/E19-ffmpeg-wasm/examples/demo.tsx` | 0；仅入口及直接依赖，无输出 | [types.txt](validation/types.txt) |
| `node --input-type=module -e <manifest完整metadata断言>` | 0；shape/completeness、3目标、sourceFiles、原文2161B/hash、两包版本、正式BLOCKED/NOT_RUN通过（静态） | [metadata.txt](validation/metadata.txt) |
| `pnpm exec -- biome check entries/E19-ffmpeg-wasm/examples entries/E19-ffmpeg-wasm/library.json entries/E19-ffmpeg-wasm/verification.json entries/E19-ffmpeg-wasm/official/source-evidence.json entries/E19-ffmpeg-wasm/validation/baseline.json entries/E19-ffmpeg-wasm/validation/resource-prerequisites.json` | 0；15文件，无修复 | [biome.txt](validation/biome.txt) |

首次Biome问题只局部修复：URL改模板字面量；任意本地音频没有真实自动转写，不添加空轨伪装字幕，音频元素局部规则注释解释该限制。输出结构文字和可下载WAV保留；未声称字幕或无障碍实测通过。随后只跑首次适用定向检查，没有重复全目录或其他条目有效套件。

最后 `git diff --check -- packages/library-lab/entries/E19-ffmpeg-wasm` 的退出码/日志在manifest的diff记录。源码/metadata执行输入摘要在manifest；本地报告和提案不改SDK执行输入。

## 文件清单

原14文件中AGENTS保持不变；guide/agent/library/verification同步；examples原9文件正常排版，example加观察/显式codec/下载/清理反馈，wav-output-policy.test增加半秒边界，原策略逻辑保留。新增examples/workshop.css、official/readme.md、official/source-evidence.json、本local-validation.md、validation/baseline.json、resource-prerequisites.json、format.txt、biome-initial.txt、policy/types/metadata/biome/diff.txt、local-runs.json和browser-proposal.txt。没有新增/下载二进制媒体或核心资源。

## 解除条件和主控后续

1. 由有权限的维护者明确完成core0.12.10 GPL再分发复核，记录范围与授权；本worker不会设置已审标志或自行裁定许可。
2. PLATFORM在获得授权后，通过既有受门禁流程暂存匹配版本ESM js/wasm，记录生成marker、版本、许可、字节/hash，保证BASE_URL下同源路径和正确静态响应。不能用CDN、任意替代核心或去掉门禁来满足本项。
3. 主控以稳定输入构建匹配候选，核实包装器Worker、WASM、脚本/CSP资源路径；不因单线程示例去擅改根隔离头。共享build可检查内容/官方展示，但没有核心仍不证明SDK转换。
4. 真实浏览器逐步执行load/writeFile/exec/readFile；basic原创音与business原创48k双声道文件得到可保存/解析WAV，核对exit0、16k/mono/PCM16、实际时长、虚拟文件删除和URL/Worker清理。advanced0.5秒、超时/错误恢复、取消后重载分别留原始证据。
5. [browser-proposal.txt](validation/browser-proposal.txt) 是未来获准后的Playwright源码提案文本，未接公共e2e、未运行/类型检查。包含真实下载产物和加载中取消；后者不能代替转换中取消，短纯音来不及取消时必须保留该项未测，而非插入假的SDK延时。
6. 最后独立复核六项与正式收据仍按主控授权和匹配干净提交执行。当前交稳定内容检查点，SDK/六项BLOCKED，build/browser正式NOT_RUN，不等资源授权继续占用执行。
