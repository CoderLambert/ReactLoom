# B04 独立只读内容复核

复核者：quality_f05（非作者）。2026-11-10，仓库 HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4` 的当前未提交条目；主控 candidate10 构建后授权仅落此报告。审查 library/guide/agent、全部 examples/tests、local-validation、official 原文与完整来源响应、现有公共三条 browser 源码。未修改实现、未重跑作者有效套件，未自行执行浏览器。

## 问题与待测边界

没有已确认 P1/P2。P3：local-validation 实际命令表的官方 fetch 行使用“python entries完整路径/…”占位，metadata 行是描述性名称；收尾应保存完整可执行 argv 或对应脚本路径。此问题不推翻现有原文/hash、策略结果，但会影响命令独立复现。

损坏字符串走实际 0.81.0 `_loadFromData` → `_dispatchError`，父组件在 player effect 订阅错误。缓存 WASM 时首次错误与 effect 订阅的具体时序尚未由本复核者实测；现有高级 browser 已有真实错误提示/恢复断言，应据运行结果裁定，不把潜在时序风险记成已复现缺陷。

## 六项结论

| 维度 | 状态与证据层级 | 依据 |
| --- | --- | --- |
| 技术准确 | PASS：匹配类型/源码静态复核 | 实装 React 0.20.0 → Web 0.81.0；实际 source map 的 BaseDotLottieReact ref 创建、延迟 destroy、数据 effect 与引擎 ready/load/getter/play/pause/stop/setFrame/setSpeed 对应源码。example.tsx:73 的事件/isLoaded 处理、113 的策略与停止意图分开；131 是当次真实 getter 快照。 |
| 解释清楚 | PASS：静态 | guide:17 区分 ready/load，19 明示本地 JSON 仍需 CDN WASM，39 明示整个组件浏览器挂载前提；47 区分意图/引擎，51 交代 650ms 本地业务，66–70 交代 wrapper、应用监听与共享 WASM 所有权。 |
| Demo 有用 | NOT_RUN：真实浏览器待主控 | 三目标分别为播放/停止/getter、独立业务成功/减少动态、帧/速度/媒体/真实坏数据恢复。静态路径完整，不能由 policy4 或旧 candidate09 环境探针升级 Canvas 运行结论。 |
| 源码可迁移 | PASS：静态/复用作者类型结果 | 4 sourceFiles 含实际入口、策略与原创 pulse.json；60帧/30fps、无外部图片字体资产，无 Lab alias；普通 listeners/media/visibility/timer 清理对称。实际 Web destroy 先发事件再 removeAll，故观察器可记录真实旧 Canvas 销毁，应用不重复 destroy。 |
| 官方来源可靠 | PASS：来源与字节复核 | 官方 0.20.0 tag 对应 commit `e34f2cf2dc609ebae482615f64be4dee4218a4eb`，`packages/react/README.md` 原文；本次实算 11735B，SHA256 `5b8263be74ae7e5bd91155c66eb688f82954a7e3d6c205cc4949b86bfc86235c` 与 metadata/原始公开 GET 证据一致。根/包目录只有英文 README；官网 GET200、完整 XFO DENY 且 CSP 无 frame-ancestors 覆盖，blocked 有依据。 |
| 结果可复核 | NOT_RUN：整体运行待主控 | 已有 policy4/严格类型/Biome/metadata 只在其实际范围有效；公共三条 @B04 测试使用真实 WASM 响应、Canvas 2D 像素、SDK getters、媒体、坏 JSON、旧 Canvas destroy，未发现 SDK/Canvas/时钟 mock。尚未由本复核者执行；formal sdk/build/browser 保持 NOT_RUN。 |

## 来源与后续

- [匹配官方 README](https://github.com/LottieFiles/dotlottie-web/blob/e34f2cf2dc609ebae482615f64be4dee4218a4eb/packages/react/README.md) 与 official/source-audit.json；匹配源码从安装包 dist/index.js.map 的 sourcesContent 核对，没有以当前主分支代替安装版本。
- 作者实际日志为 validation/{policy,typecheck,biome-fixed,metadata}.txt，按 local-validation 复用，没有因独立 review 重跑。
- 主控使用匹配 candidate10 执行真实浏览器并另存结果。原生 document-hidden 在既有宿主探针仍 visible，保持 NOT_RUN；不改写 document.hidden、不发送假 visibility 事件。此报告不代替正式收据，也不提前宣称图形运行 PASS。
