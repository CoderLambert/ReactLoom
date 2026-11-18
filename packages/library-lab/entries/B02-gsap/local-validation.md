# B02 GSAP 本地质量交付与验证

## 范围与基线

实际仓库cwd `/home/lambert/githubRepos/lambert/ReactLoom`，定向检查cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`。Git HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`；原9文件及各自摘要见 [baseline.json](validation/baseline.json)。没有把条目内容摘要当Git SHA。

只写本条目，保留其他工作者修改。没有改公共src/e2e/scripts/runners、依赖锁、索引、队列/results，没有提交/推送/发布或全目录generate/typecheck/build。candidate09只接收了可编译中间点；此处完成后仍由主控收匹配候选、独立复核和真实浏览器。

**真实数值SDK3PASS、纯策略6PASS、局部类型/格式/metadata通过；DOM/CSS/自动时钟/真实visibility与完整卸载行为NOT_RUN。正式verification三项均NOT_RUN。** STABLE表示停止写入，不能当作正式PASS或content_done。

## 问题、变化与两个独立目标

原三层共享一条时间线，主要只是卡片数/stagger变化；旧guide大量篇幅教未挂载ScrollTrigger和业务状态机，并把5个百分点发布误写成每个整数。保留有效context、偏好/visibility门禁、原纯进度策略和局部revert，合并重复business，交付两个独立目标。

| 目标 | 实际输入/处理/输出 | 浏览器验收预期 |
| --- | --- | --- |
| basic：时间比例与缓动 | 共享createCardTween调用真实fromTo；duration1.2、x0→60、opacity.35→1；none或power2.out | 原生滑块手动定位50后暂停，SDK/计算transform分别x30或52.5；同时间不等于同位移；重播新代，选择器不影响宿主外同名类 |
| advanced：时间编排与所有权 | 真实Timeline、4卡duration.6/stagger.14尾1.02；detail标签.7、时长.4，总1.1 | 标签seek/read真实时间和children；反向进度下降；手动暂停不自行恢复；RM静态/无owner/100；真实visibility暂停；context.revert还原样式、移除本代Tween |

React只存内容/意图及受控进度；GSAP独占目标transform/opacity。原策略每至少5个百分点及端点发布，手动seek即时更新。范围内创建动画，事件仅控制已有对象，重播由effect新建下一代。回调disposed守卫、偏好与visibility监听对称清理并在绑定后同步当前状态。没有ScrollTrigger、@gsap/react、网络业务、工作流或素材。

cleanup先停止本代回写，再context.revert({suppressEvents:true})；随后从实际getTweensOf读剩余数量，标记只供观察，提案另查实际inline样式。没有全局kill/ticker.sleep，不承诺共享GSAP ticker立即停止。组件初始化读取浏览器偏好，迁移明确整个查看器client-only/禁子树SSR；仅use-client可能预渲染，不冒称hydration已验。

## 六项独立复核

| 维度 | 状态/层级 | 证据与限制 |
| --- | --- | --- |
| 技术准确 | PASS，静态/真实数值SDK；DOM NOT_RUN | 安装3.15.0类型/gsap-core与官方context资料；真实共享builder3项验证ease/time、实际标签/重叠/方向与revert；普通对象不冒充CSSPlugin/DOM/自动时钟 |
| 解释清楚 | PASS，静态内容复核 | guide工程问题→Tween/Timeline模型→同50%不同位移→标签/重叠→范围/回写/门禁→迁移；自建策略/本地fixture/SDK与未实现插件明确 |
| Demo有用 | NOT_RUN，目标/源码静态复核已完成 | 两目标有独立机制、原生控件与真实getter/样式；三份Playwright源码提案尚未执行，不因类型通过升级运行PASS |
| 源码可迁移 | PASS，静态/strict类型；迁移运行NOT_RUN | 五实际运行文件含CSS与共享builder；无Lab alias/额外资源；客户端及唯一样式写者前提明确，context/revert清理有独占范围 |
| 官方来源可靠 | PASS，固定原文/完整HTTP | 官方3.15.0固定commit与package版本相符，只有根英文README；6199B/sha一致。官网实际XFO sameorigin使跨源嵌入blocked，未宣称Lab-origin allowed |
| 结果可复核 | NOT_RUN，整体浏览器运行 | 本地数值3/策略6/类型/提案/metadata日志及14输入摘要可复核；DOM/时钟/可见性/原生资源未跑，整体不能记PASS |

## 官方来源、许可与保存过程

- 安装 `gsap@3.15.0`，包自带types与CSSPlugin。包内声明Standard no charge许可，不是MIT；官方标准许可当前有可视化动画搭建竞争产品等边界，实际范围以 [官方条款](https://gsap.com/standard-license/) 为准。本例不引入额外插件或收费资产。
- 官方仓库 `greensock/GSAP`，tag3.15.0固定commit `13e2b790546426a1a2e0e9b409f3f8dc6d6611f2`（ls-remote研究结果）；固定根目录/README/package三个实际GET200，根候选仅README.md，无官方中文README。固定package声明3.15.0，未把最新官网版本冒充安装版本。
- [官方原文](official/readme.md) 英语6199字节，SHA-256 `66a79667b0538b19634b5a000a9a3debe588c98d390424e73e5d4de847270828`；sourceUrl/repo/ref/path/language/version/syncedAt在library.json。没有改写、翻译或混入本地讲解，远程HTML/图片由平台原文策略处理，未改公共安全边界。
- [source-evidence.json](official/source-evidence.json) 保存四请求URL/最终URL/状态/全部响应头，前三body字节/sha。官网GET只读头，不伪造正文摘要。X-Frame-Options:sameorigin明确限制跨源Lab，另有X-Content-Security-Policy frame-ancestors self；blocked的充分依据是XFO，不依赖旧版私有CSP头或load事件。真实Lab-origin预览未跑，不写allowed。
- 官网/原文请求发生在主控冻结期间，只有网络读取，返回字节/头暂存在工具会话内存；明确释放后才写入条目。原实际命令为仓库cwd的 `python3 -` 内联urllib，原始完整stdout（含原文base64）/退出码0见 [source-fetch.txt](validation/source-fetch.txt)。各响应Date和整体checkedAt保留，开始时间未单独捕获，明确NOT_CAPTURED不补造。只读重取配方 [source-request.py](validation/source-request.py) 输出证据、不覆盖现有快照；显式同步须复核版本/原文diff/metadata，未重复有效网络读取。

## 实际定向命令与日志

除上述source读取在仓库cwd，其余均在Lab cwd。日志含实际ARGV、UTC起止、退出码、原始stdout/stderr。没有force-exit、SDK mock、假Element/style/RAF或SKIP占位。

| 实际命令 | exit/实际结果 | 原始日志 |
| --- | --- | --- |
| `pnpm test:sdk --entry=B02` | 0；3PASS/0SKIP，真实普通对象/共享Tween与Timeline，context恢复原x/opacity且getTweensOf为0；未访问DOM | [sdk.txt](validation/sdk.txt) |
| `pnpm test:policy --entry=B02` | 0；6PASS/0SKIP，原门禁、百分比边界、5个百分点/反向发布规则；仅排版，无GSAP导入 | [policy.txt](validation/policy.txt) |
| 局部入口strict tsc（完整参数下列） | 0；最终补偏好/visibility初始同步后只重查受影响入口，未重跑未变builder SDK/纯策略 | [types-final.txt](validation/types-final.txt) |
| 同字节提案临时.ts strict tsc | 0；仅静态检查Playwright源码，不执行浏览器 | [proposal-types.txt](validation/proposal-types.txt) |
| `pnpm exec -- biome check --write` 指定条目examples/tests/library/verification/metadata/临时提案 | 0；11文件正常排版 | [format-final.txt](validation/format-final.txt) |
| 最终 `pnpm exec -- biome check` 指定10个当前源/metadata文件 | 0；无修复、无诊断 | [format-check.txt](validation/format-check.txt) |
| `node entries/B02-gsap/validation/metadata-check.mjs` | 0；validateEntry/completeness[]、2目标/5源、实际3.15.0、6199B/sha/blocked依据/formal NOT_RUN一致；14输入摘要 | [metadata.txt](validation/metadata.txt)、[input-hashes.json](validation/input-hashes.json) |

入口类型完整命令：

```sh
pnpm exec -- tsc --ignoreConfig --noEmit --target ES2022 --lib ES2022,DOM,DOM.Iterable --module ESNext --moduleResolution Bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --allowImportingTsExtensions --types vite/client,node entries/B02-gsap/examples/demo.tsx
```

初次format-initial.txt exit1的两个effect额外依赖提示已解决：generation显式重播、新owner需重新应用既有意图，保留必要依赖并准确局部说明，不能为消lint删掉回放行为。types.txt是中间可编译0，checkpoint-format.txt是中间6文件0；候选09通过只属于当时输入，不替代当前完整内容验收。没有覆盖旧失败日志。

## 浏览器提案与剩余状态

[browser-proposal.txt](validation/browser-proposal.txt) 包含两个目标的真实DOM/CSS样式、运行时钟、RM和revert，以及独立原生visibility用例。提案临时复制为browser-proposal.ts过类型/Biome后删除；未改公共e2e。宿主外同名类是实际DOM负对照，不是假动画输出；原生matrix与style/getProperty互相核对，不能用SDK数值对象替代。

原生visibility若headless带到前台仍不能让目标页hidden，该单独case明确SKIP/NOT_RUN，不改document.hidden，不计为运行PASS。真实隐藏/恢复始终需要对应浏览器能力，不能用策略6项补足。真正DOM/播放/样式还原、手机布局、读屏/触控/目标设备性能与完整原生监听计数尚未验收。

主控接入提案，构建匹配输入，真实运行并保存截图/日志。正式sdk/build/browser继续NOT_RUN。当前修改/新增范围：guide、agent、library、verification说明；example；demo/timeline-policy/原policy测试仅格式；motion、workshop.css、sdk.test.mjs、official两文件、本记录及validation证据。完整目录与scoped diff/链接/14输入核对见 [final-files.txt](validation/final-files.txt)、[final-inspection.txt](validation/final-inspection.txt)。

## 冻结交接

candidate09中间冻结UTC `2026-11-10T12:34:04.643171+00:00`，当时guide/agent/官方/完整检查未完成，明确未计content_done。主控稳定构建结束后显式释放，继续完成本记录所列交付。完整STABLE时间在末尾记录，之后停止所有条目写入（包括日志/文档）待独立复核。

完整交付 STABLE：`2026-11-10T12:53:01.806378+00:00`。停止B02所有写入（含日志/文档），等待独立复核和主控真实浏览器；正式verification仍NOT_RUN。

## 主控真实浏览器闭环 / candidate10

真实GSAP三场景和官方展示4项PASS：Tween时间50%映射none/power2.out真实DOMMatrix、Timeline标签/重叠/反向/暂停、context局部revert与外部负控制、动态媒体门禁；独立临时Chromium无焦点模拟完成真实hidden/visible，手动暂停意图回前台保留。真实数字对象SDK3与policy6分开记录。

共享候选2182输入SHA25b58acba7305fb7dc70bd492e23c6056c21064e81cf07098cd339a5786297bf，lint/type/build/catalog全部0、stability=[]；browser固定dist，不隐式build。docs/library-lab/evidence/quality-upgrade/candidate-10/browser.txt共30项24PASS6FAIL，本条4PASS无失败，其他条目失败单独处置。非作者六项报告见路线图results/review，本地六项闭环，正式sdk/build/browser仍NOT_RUN待干净授权提交与recorder。未测触摸/读屏/性能/SSR hydration等边界保持，不泛化本地结果。
