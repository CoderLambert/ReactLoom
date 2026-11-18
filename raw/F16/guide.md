# dependency-cruiser 18.5.0：从实际依赖边验证方向和环

需要按源码import关系约束架构时选择dependency-cruiser；未使用文件/依赖看Knip，bundle体积看构建分析。它产生模块依赖图数据和规则违反，不等于执行应用、测功能或测包体积。本条只扫描原创workspace三个隔离src，绝不指向ReactLoom产品树。

## 规则方向与三个目标

config.cjs的forbidden有两条severity:error。domain-must-not-import-ui：from path匹配domain目录是依赖发起方，to path匹配ui是被引用方；domain→ui禁止，不是反过来。no-circular-dependencies：from:{}覆盖所有模块，to.circular:true检测形成环的依赖。doNotFollow/exclude node_modules使扫描不展开第三方树，不等于项目所有别名/外部模块都已配置。

basic：main→domain/get-article、main→ui/render-title，三模块两边，零违反。business：domain/summary→ui/badge，三模块两边，确切domain-must-not-import-ui错误1。advanced：first↔second，两模块两边，循环规则错误1；不调用这两个函数，静态import足以形成图，不需要真实递归栈溢出。

真实报告结果见validation，网页不在线画假图或执行CLI。当前JSON是图的模块/依赖数据，不是已经生成SVG/Mermaid；要图形需另选择工具官方图报告器及Graphviz等环境，本例未实现。

## 实际运行与双报告器

```bash
pnpm add -D dependency-cruiser@18.5.0
node examples/run.mjs basic
node examples/run.mjs business
node examples/run.mjs advanced
node examples/verify.mjs
```

上述为复制entry结构后目录；Lab命令面板cwd packages/library-lab，前缀entries/F16-dependency-cruiser/；仓库根再前加packages/library-lab。run只接受三个固定level，子进程cwd始终workspace，配置和扫描src都相对该目录；不会解析任意外部shell输入。

run输出实际JSON，透传实际工具退出码。**18.5.0本次JSON报告器三个场景均退出0，即使summary.error为1**；所以run business退出0不能当架构健康。verify每场景独立跑一次json和一次err：json用实际modules、summary.error与命名规则核验；err单独验证basic0/business1/advanced1。外层verify在这两个合同均满足时退出0，业务/环的err1是预期反例通过，不是工具失败或把错误吞掉。

verify stdout包含六条结构化进程记录（真实command/cwd/status/signal/stdout/stderr）和三条摘要，验证函数不编造工具输出。错误启动/信号/超时/坏JSON/空模块/错误命名或不一致计数会失败。每进程60秒/8,000,000bytes缓冲预算；输出预算不是源码解析CPU/内存沙箱。完成后同步子进程已退出，没有常驻server/Worker/临时用户源文件要清理。

## CLI解析与TypeScript兼容缺口

深层fixture cwd里的pnpm exec在此仓库找不到depcruise bin，初始exit254保留。cli.mjs现在从import.meta.resolve('dependency-cruiser')定位实际18.5包main，读取其真实manifest/bin，以当前process.execPath启动该CLI；不把18.5 JS API当CLI，也不依赖PATH或外部全局安装。包版本不匹配即拒绝。

18.5实际supportedTranspilers.typescript为>=2 <7，本仓库TypeScript7.0.2不支持；第一次真实JSON零modules、进程0，但verify拒绝，所以未假绿。当前fixture改等价原生ESM.js，保持同样规则/图，不改依赖锁。这个成功**不证明TypeScript7/类型导入分析**。迁入TS工程需在自己的独立环境安装受支持TS版本并验证其解析与别名/tsconfig，不能借仓库别处的TS5路径当可移植方案。

## 完整迁入

保持examples结构：run.mjs、cli.mjs、workspace/config.cjs和所选level/src所有JS文件；要verify还需verify.mjs、result-policy.mjs以及basic/business/advanced三个src全部，共13个运行原件。result-policy.test.mjs仅可选纯策略验证，不是工具SDK；advanced sourceFiles列出verify的全部输入，不遗漏其它两场景。

Node须匹配实装engines ^22||^24||>=26（本次v26.13.1），ESM .mjs及config.cjs；无React/Provider/CSS/env/账号/服务/浏览器。只把Node脚本复制到generated app不会自动给业务树加规则，应按具体工程配置路径/入口/TS/别名后独立验证，Lab本身不复制进模板。

## 失败、输出和安全边界

规则path按正则匹配工具记录的模块路径，移动目录要同步from/to和fixture。JSON count由工具输出，不从CLI进程码猜；err文本即便含rule名也不能替代JSON结构和计数核验。pure policy只校验JSON/退出合同，绝不算真实CLI执行。

原始JSON optionsUsed含本机baseDir/environment，validation是本地运行证据；公开报告前审查绝对路径/业务名称，不把内部完整图上传外部服务。当前fixture原创无秘密。没有扫描全仓库/生产图、性能基准、打包体积或图像生成声明。

## 官方与证据

固定v18.5.0上游README/LICENSE原文字节和tag/commit/hash见official，完整tree无主库中文README时en回退；GitHub官网实际deny/frame-ancestors none，blocked直达。实际verify六CLI、纯policy4、scopeBiome与迁入执行证据见local-validation。主控浏览器仅验配方/源码/官方展示，不代替CLI；formal sdk/build/browser无收据仍NOT_RUN。
