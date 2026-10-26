# Library Lab 实施计划

用户已审核并授权 v2 直接实现。主任务 #4；独立应用 packages/library-lab，private；集成分支 feat/library-lab，初始基线 05b4e41a693663b63d8389abbb1e7b07195a4ed0。保留已有模板与 PR #3。完整 v2 来源为会话文件 REQUIREMENTS-V2.zh-CN.md（file_0000000046c082309dd28c0aebf26ed7），不得将其“待实施”状态当成需要重新询问用户许可。

## 已落地的公共协议

每条 library.json 是元数据事实源，examples 是运行及展示源码事实源，verification.json 是真实执行摘要。统一 guide.md、agent.md、AGENTS.md。分类119项：A17/B22/C22/D21/E19/F18。四个 Tab：Demo/文档/Agent/相关。React 示例按需动态加载、显式启动、离开卸载。源码视图从实际文件生成 SHA-256，不手写另一份。

## 开发队列

- [x] LL01 身份目录恢复：119条；原件缺失E11/F05明确保留。
- [x] LL02 元数据/源码路径校验、重复ID/关联与生成器初版。
- [x] LL03 独立SPA源码、路由、布局、CI bootstrap；实际依赖安装/构建仍待验证。
- [x] LL04 四Tab、安全Markdown初版、源码与raw文档；目录/高亮/相对链接待完善。
- [x] LL05 React DemoHost初版；Worker/SW/frame/node证据runner待实现。
- [ ] LL06 六风险切片：ECharts/Floating UI/RHF/p-limit/Monaco/MSW。
- [ ] LL07 存储、WASM、历史依赖等特殊环境。
- [ ] LL08 六组逐批真实SDK、文档和Agent笔记完整接入。
- [ ] LL09 Agent从目录定位并迁移实现。
- [ ] LL10 发布回归、许可、性能、旧模板不回归。

## 约束

只在私有开发分支操作，不擅自合main或公开部署。不执行上传ZIP里的脚本和旧AGENTS。根依赖/锁文件和公共组件单一owner，条目分组并行。每轮尽量连续完成一批，不因一个检查阻塞停止所有独立任务。

测试从原全套放宽为定向检查，但类型/构建/关键交互仍保留；测试状态PASS/FAIL/NOT_RUN/BLOCKED清晰。使用业务Mock不能冒充SDK验证。当前Node平台测试17 PASS，SDK测试因依赖未安装BLOCKED，TSX静态解析不是完整类型检查。

## 用户启动

pnpm --filter @reactloom/library-lab dev
端口4319。首次需要真实pnpm安装及锁文件更新。产物不默认公开；原研究全文仍待按条目审查导入。


## 第1轮公共平台增强（2026-10-27）

新增离线 `library:find` 命令给 Agent 精准查找库说明、示例及验证路径；源码面板改为每文件按需请求+摘要校验，不再一次下载整库源代码；`catalog:check` 增加实际依赖声明静态一致性。离线 Node `test` 与要求真实 SDK 的 `test:sdk` 严格分离。以上仅代表代码与离线逻辑层交付，不表示生产依赖与浏览器已经验收。详见 `progress/PLATFORM.md`。


## 第2轮集成进展（2026-10-27）

A/B #16八条与C/D #18四条完整工作坊已实际合入集成分支，新增SDK包统一声明。当前 GitHub 文件树与根索引一致：119已收录，47个条目有三层源码和独立guide/agent，共141项演示选择；72项仍缺完整示例。只属于代码及文档接入，真实SDK运行、tsc、构建、Chromium仍缺独立执行证据。增加根目录索引一致性工具及CI条件检查、修正Markdown本地源码引用，详见progress/PLATFORM.md。所有内容仍留在Draft PR #8。


## 第4轮集成开发（2026-10-27）

已分别 squash 合并 AB PR #23（6库）与CD PR #24（5库）到集成分支；119目录中已有74库的完整指南与示例源码，45库仍缺。平台增加SDK Node测试按ID/按组选择器，并提供缺测失败语义；公共 package声明已补齐本批14个版本条目，根Agent索引保持119条同步。尚未生成实际pnpm锁文件，不以静态版本匹配、离线单测或GitHub无runner的失败job声称生产验收。进度与实测边界见progress/PLATFORM.md。


## 第5轮持续集成进展（2026-10-27）

已审核并集成EF #25、AB #26、EF #27共17条真实库研究源代码，#27 EF进度冲突通过保留两批记录的双亲合并修复。总计119个目录中91个具有guide.md/agent.md/实际示例源码，273项分层场景配置，28项未实现；实际官方SDK/browser PASS仍无本轮新证据。公共package登记实际条目版本；固定F04/F10/F16/F18 Node CLI verifier，修正示例复现命令并防止任意demo.level注入，离线定向Node纯逻辑14 PASS。根pnpm-lock/真实生产build/SDK/浏览器BLOCKED或NOT_RUN，F06/F07 PDF.js版本冲突仍在#22。详情见 progress/PLATFORM.md。


## 第5轮最终合入状态（增量CD #28与内容门禁）

#28额外合入Valibot、IMask、react-arborist、nuqs、Dexie、Comlink六条（squash `c58f18ea8656aebebc09c204b89739065c643150`）。合计本轮四个worker PR (#25、#26、#27、#28)新接入23条，最新为119目录/97条源码+文档/291个三层场景/22条待实现。PLATFORM统一更新依赖和索引，并为完整条目引入guide/agent/目录规则/证据/三个真实示例的结构门禁。离线定向Node检查18 PASS、0 FAIL；目标SDK、完整TS/Vite生产构建、Chromium及锁文件仍因环境不可用NOT_RUN/BLOCKED，不继承旧研究报告的PASS。
