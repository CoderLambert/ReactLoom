# A03 Chart.js 本地质量整改与稳定交接

## 对象、范围与前提

- 仓库cwd `/home/lambert/githubRepos/lambert/ReactLoom`；检查cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`。HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`；开始时9文件且无本条目diff，entry-relative摘要 `207dc5ec1698c1ae1241e3d8f42cb422b1d62e3e3478c0868d9b96e9929fce0e`，原始文件SHA见 [baseline](validation/baseline.json)。摘要不是Git提交。
- 先只读完整研究，主控candidate-06稳定后释放写入。沿用根/本包/条目AGENTS、协作规则与quality skill三个references。保留他人所有工作，只写本条目，没有公共src/scripts/e2e、依赖锁、生成索引、queue/results、提交/推送/发布、共享generate/typecheck/build操作。
- 保留原按需注册、真实Chart构造、数据update、类型变化destroy、Canvas命中、表格选择、后台/模式/上界采样门与清理。没有机械重写有效数据策略或扩张未挂载业务。
- 当前chart.js确为4.6.1、MIT。Node v26.13.0、pnpm10.33.3；浏览器运行仍需现代2D Canvas和匹配候选。Node真实Canvas fixture复用已锁定/已安装的 `@napi-rs/canvas@1.1.0`（由当前pdfjs-dist可选依赖解析），没有新增/安装共享依赖。这个测试前提不是运行Demo的依赖；若可选原生库未安装，应报告明确前提缺口，不换假Canvas。

## 目标、实现和必要产物

三个声明目标分别是：basic从注册/Canvas绘制到真实点选与等价表格；business用同一Chart更新数据；advanced类型重建、实际尺寸与动态采样所有权。原按钮/Canvas名称/表格操作路径保留。

1. 新增chart-model.ts集中真实组件注册与createReadingConfig；example只持有自己Canvas的Chart。共同模块支持bar/line，不声称basic独立拆包或已测tree-shaking收益。
2. 自有plugin在afterInit/afterUpdate/afterDestroy记录实际SDK回调；观察实际chart.id、meta.type、dataset、active、逻辑尺寸和BarElement/PointElement中心点。没有从配置值伪造SDK结果。中心点保留nullable返回，dataset不以Number转换掩盖真实类型。
3. 当前counts在构造时传入；数字变化只写dataset+update('none')，类型变化先destroy再new；选择effect按新类型重新应用。业务初值总1127、每步+42；一切来自原固定公式，没有网络或HTTP成功承诺。
4. 容器70%/100%控件触发真实布局与SDK响应式；独立resize按钮直接调用当前Chart.resize。CSS提供专用相对容器和310px高度，没有额外ResizeObserver或自管DPR。
5. 动画仍关闭。减少动态效果时默认暂停显式自动采样，需要额外允许；visibility/media监听、400ms计时器和自身Chart有成对清理。原4策略保留，新增1项reduced-motion采样边界。
6. 正常排版可迁移源码/CSS、完整中文guide/agent、匹配原文、完整官网头、原生PNG与日志及三目标Playwright提案齐全。前端没有增加PNG/CSV下载或外部数据服务。

## 六项逐项结论

| 维度 | 状态与证据层级 | 当前依据与限制 |
| --- | --- | --- |
| 技术准确 | PASS：本地源码/类型+真实SDK | 4.6.1公开API核对；真实Chart+原生Canvas2项通过，覆盖绘制/update/命中/active/resize/destroy；5纯策略独立。React/DOM生命周期仍待browser |
| 解释清楚 | PASS：静态内容自检 | 用途/机制/注册表/所有权→3实验→迁移；区分React业务状态、SDK副本、自建plugin计数、原生Canvas和浏览器证据，删未挂载扩张 |
| Demo有用 | NOT_RUN：真实浏览器待主控 | 3独立目标与精确操作/观察点齐全；Node原生像素证明不代替真实鼠标/键盘、CSS resize/字体及后台变化 |
| 源码可迁移 | PASS：入口类型/格式/文件自检 | 5个必要运行文件列sourceFiles；真实依赖、父容器、选择/更新/销毁与listener所有权说明齐；无新增前端依赖或平台协议 |
| 官方来源可靠 | PASS：固定公开HTTP原文+摘要 | v4.6.1/固定commit/package版本匹配，完整tree无中文候选，原文2605B/hash/语言/日期；官网完整GET头、unknown和直达准确 |
| 结果可复核 | NOT_RUN：整体交互验收 | 真实SDK/策略/类型/metadata日志、PNG产物与摘要齐全；3目标browser提案未执行，不能据此给整体验收或正式收据PASS |

正式verification sdk/build/browser均NOT_RUN。独立复核与真实浏览器由主控安排，不标content_done。

## 官方依据与响应

- 实际官方ref `v4.6.1` 是直接指向commit `76d8cf895a7485dc838c90ef37e2bc9d9e388fcb` 的tag；固定package.json实际声明4.6.1，与安装包一致。完整recursive tree非truncated，README候选仅根README.md，无官方中文候选。
- 原文 [official/readme.md](official/readme.md) 来自 [固定出处](https://github.com/chartjs/Chart.js/blob/76d8cf895a7485dc838c90ef37e2bc9d9e388fcb/README.md)；raw HTTP200，2605字节，SHA-256 `30418232ad2cc5a51fa0938e12dc97e31cfd1fb3b0bc352132f281c0c10da348`，同步 `2026-11-10T10:49:57.727675+00:00`。未改写/翻译原始字节。
- [source-evidence.json](official/source-evidence.json) 保留tree、固定package内容和响应、README完整响应头、官网完整GET头及最终URL。来源在只读研究时已实际取回并缓存，获释放后原样落盘，没有为补材料重复抓取。
- [集成/注册](https://www.chartjs.org/docs/latest/getting-started/integration.html)、[响应式](https://www.chartjs.org/docs/latest/configuration/responsive.html)、[实例API](https://www.chartjs.org/docs/latest/developers/api.html)结合本地dist/types/index.d.ts与dist/chart.js核对：BasicPlatform真实获取2D context，update('none')、active API、resize、destroy清registry/context/events。当前官方文档与固定源码分开记，不把latest当固定版本原文。
- 官网 `https://www.chartjs.org/` GET200、最终URL相同，完整头未见XFO/CSP；没有Lab-origin iframe实测，维持unknown/直达。只取官网头，不声称官网body摘要，也不把README raw的deny头当官网策略。

## 实际执行命令与日志

除最后diff外，cwd均为 `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`。子进程stdout/stderr直接保存，完整argv/UTC时间/exit/log SHA在 [local-runs](validation/local-runs.json)；metadata内联断言全部保留。源码格式化前的首次4文件format仅有原始工具输出，没有事后补造时间。

| 实际命令 | exit/结果 | 原始日志 |
| --- | --- | --- |
| `pnpm exec -- biome check --write entries/A03-chartjs/examples entries/A03-chartjs/tests entries/A03-chartjs/library.json entries/A03-chartjs/verification.json entries/A03-chartjs/official/source-evidence.json entries/A03-chartjs/validation/baseline.json` | 首次1：output冗余role、两处effect类型依赖需语义明确；修复后0，11文件 | [首次format](validation/format.txt)、[format-final](validation/format-final.txt) |
| `node --test entries/A03-chartjs/tests/sdk.test.mjs` | 0，2 PASS，0 FAIL；真正Chart与原生Canvas，普通Node正常退出 | [sdk.txt](validation/sdk.txt) |
| `node --test entries/A03-chartjs/tests/chart-stream-policy.test.mts` | 0，5 PASS，0 FAIL；纯本地策略 | [policy.txt](validation/policy.txt) |
| `pnpm exec -- tsc --ignoreConfig --noEmit --target ES2022 --lib ES2022,DOM,DOM.Iterable --module ESNext --moduleResolution Bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --allowSyntheticDefaultImports --allowImportingTsExtensions --types vite/client,node entries/A03-chartjs/examples/demo.tsx` | 首次1/第二次1；基类无中心方法、nullable坐标类型；仅组件类型观察修正后0 | [types](validation/types.txt)、[types-final失败](validation/types-final.txt)、[types-pass](validation/types-pass.txt) |
| `node --input-type=module -e <manifest完整metadata断言>` | 0；shape/completeness、3目标5运行文件、官方版本/原文bytes/hash、unknown、formal NOT_RUN | [metadata.txt](validation/metadata.txt) |
| 同11文件范围 `pnpm exec -- biome check` | 1，仅新类型守卫的一处换行格式；其他10文件无问题 | [biome.txt](validation/biome.txt) |
| `pnpm exec -- biome check --write entries/A03-chartjs/examples/example.tsx` | 0，仅受影响单文件格式，修复1文件 | [biome-pass.txt](validation/biome-pass.txt) |
| `pnpm exec -- biome format --stdin-file-path=entries/A03-chartjs/validation/browser-proposal.ts` | 0，提案正常格式，未执行浏览器 | [proposal-format](validation/proposal-format.txt) |
| `pnpm exec -- tsc --ignoreConfig --noEmit --target ES2022 --lib ES2022,DOM,DOM.Iterable --module ESNext --moduleResolution Bundler --strict --skipLibCheck --types node entries/A03-chartjs/validation/.browser-proposal-check.ts` | 0，同字节临时.ts检查后仅删除自有临时文件 | [proposal-types](validation/proposal-types.txt) |

SDK/策略通过后没有再次执行：后续变化仅组件观测类型/格式及文档/提案，SDK输入graph（sdk.test、chart-model、stream-policy）未变。类型通过后仅Biome换行，因此复用有效类型。没有为了补日志/交接重复全量测试。

额外 `git diff --check -- packages/library-lab/entries/A03-chartjs` 从仓库根执行，exit/log见manifest的diff。Node/Python读取PNG尺寸最初环境没有PIL，未安装依赖，改用标准库读取PNG IHDR；没有因此重跑SDK。

## 真实产物及能证明什么

| 文件（本条目.artifacts，已ignore） | 实际尺寸/字节 | 意义 |
| --- | --- | --- |
| bar-initial.png | 700×310 / 7013B | 真实Chart初始柱图 |
| bar-updated.png | 700×310 / 7035B | 同Chart id更新后像素变化；真实命中index2与active元素 |
| line-resized.png | 820×350 / 13319B | 旧bar destroy后同Canvas新line，真实resize |

[artifacts.json](validation/artifacts.json) 保存三图SHA；bar-updated已实际打开检查，柱/轴存在。Native fixture未注册中文字体fallback，图中文字为缺字方框且Canvas透明背景；这不是浏览器排版/CSS背景证明。产物不是示意图或预填终端，未调用图像生成器或修改像素。Node命中通过实际SDK元素几何提供规范化事件对象，不是浏览器鼠标。

SDK先构造真实Canvas并画PNG，再改变dataset/update验证id不变、PNG字节不同、真实meta/hit/active；finally destroy并确认Chart.getChart(canvas)为undefined。第二项先销毁bar再在同一原生Canvas创建line，验证新id、当前数据与尺寸，finally再次destroy。没有Chart、2D方法、返回图或平台mock。它不证明React effects/真实DOM事件或浏览器资源全部detach。

## 文件清单与浏览器交接

原AGENTS不变；guide/agent/library/verification更新；原example拆出真实chart-model，保留chart-stream-policy与demo正常排版，新增workshop.css；stream-policy增加可选reducedMotion/allowMotion门，原4策略保留新增1。新增tests/sdk.test.mjs、official/readme/source-evidence、.gitignore、本记录及validation里的baseline、日志、manifest、PNG摘要和browser-proposal。生成PNG仅在.artifacts，不加入sourceFiles或Git。

[完整三目标Playwright提案](validation/browser-proposal.txt) 已格式/类型通过，但**未接公共e2e或运行**。主控在匹配候选上执行：

1. basic实际Canvas alpha像素非空；SDK中心点结合真实DOMRect换算鼠标点击，状态/表格aria-pressed/真实active一致；表格键盘Enter反向选择，并附真实Canvas截图。
2. business新增一次，1127→1169、首日110→113；实际dataset与HTML表相同，chartId/created/destroyed不变，updates增加。
3. advanced模拟真实系统reduced-motion后勾自动采样仍暂停，另允许后数字变化；停止采样再切line，新id与销毁/创建各+1，数据/选择保留；真实容器缩窄和恢复使Canvas尺寸变化且id不变；宿主停止/重进恢复初态，无pageerror。

这些提案不patch Chart、不替换Canvas、不route响应、不强制CSS或注入伪结果；读取的是本组件真正SDK观察和原生Canvas像素。DOM移除不自动证明全部原生observer/listener释放；主控如验收逐个资源，应使用独立原生观察。后台真实页签、移动端/字体/读屏、完整StrictMode/全目录构建、正式收据由主控按匹配输入处理。当前无公共改造或依赖安装阻塞，交稳定内容检查点，未标content_done。


## 主控本地运行闭环

已由/root/quality_e05独立只读复核，无未处置阻断问题；candidate-07稳定构建/类型/目录通过且真实Chromium对应全部场景通过。本库content_done，正式sdk/build/browser仍NOT_RUN。实际命令、日志、首次FAIL及定位器处置与范围见[最终逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/A03.md)，独立审查见[报告](../../../../openspec/roadmaps/upgrade-library-quality/results/review/A03-independent.md)。未重复有效SDK/策略/浏览器检查。
