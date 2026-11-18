# A01 ECharts 本地质量整改与稳定交接

日期：2026-11-10。Owner：`/root/quality_e05`。本记录为局部实现与验证，不是正式 verify:record 收据。

## 对象与范围

实际 cwd：`/home/lambert/githubRepos/lambert/ReactLoom`；开始时本条目10个既有文件无diff，Git HEAD为`1218066e706a90ba03fac8dff8c9b843dd2429c4`。先在共享输入冻结期间只读研究，收到主控“释放A01写入”后才开始修改。只写本条目，没有改公共src/scripts/tests/e2e、依赖锁、根索引、队列/results，没有运行全目录生成/构建/类型检查，没有提交推送部署。

读取根/本包/条目AGENTS与协作文档、质量路线图，复用已读的library-lab-quality Skill及三个references；逐一读guide、agent、library、全部实际examples/tests、verification。保留既有有效的模块按需注册、Canvas实例、rAF合并ResizeObserver、事件清理、1200ms稳定interval、120次上限、reduced-motion/页面可见/视口门禁。没有为了重写文案丢弃这些实现。

## 改动与学习目标

原指南较早进入收据/清理历史，最小输入到option的联系不清；basic/business缺少更新与删除系列的直接操作，SDK套件使用与Demo不同的简化option。现在同源配置函数把七日指标贯穿配置/图/表/合计，保留原高级场景。

| 场景 | 问题、操作、预期观察 | SDK / 自建逻辑分界 |
| --- | --- | --- |
| basic | 周一+5：12→17、合计158→163；option/柱形/表格同步；复位恢复；实例ID不变 | SDK setOption/Canvas/showTip；数组变化与合计为本例逻辑 |
| business | 取消/恢复上周对照：previous-reads与表行一起移除/恢复，默认上周合计129 | SDK完整配置替换；showPrevious状态和表行由应用管理 |
| advanced | 播放/暂停；减少动态/隐藏/离屏门禁；缩小容器至65%后真实getWidth变化、getHeight=300；复位清计数 | SDK折线/resize；1200ms本地生成、用户意图与120次上限为应用策略 |

新增`examples/reading-option.ts`、`workshop.css`；修改`examples/example.tsx`、`demo.tsx`、`stream-policy.ts`、两份tests（既有stream-policy仅格式化，SDK改成消费真实同源option）；改写guide/agent，更新library并补official/readme和完整HTTP来源；新增validation日志及本记录。AGENTS与verification保持原样，正式状态仍NOT_RUN。

## 技术与来源核对

- 已安装echarts/package.json版本6.1.0、Apache-2.0，依赖zrender6.1.0。官方tag6.1.0直接指向固定commit `c5a48f5f97d23e5379720870b8444cd05b50ffb4`，同ref package.json版本6.1.0。
- 本地types/dist/echarts.d.ts:8975起声明notMerge、lazyUpdate、replaceMerge与resize选项；lib/core/echarts.js:440起解析这些setOption参数。公开中文手册说明core按需注册renderer、容器resize/dispose、动态数据调用setOption，已与匹配版本源码核对。
- 选择README前读取该ref完整GitHub tree；候选为README.md、extension-src/bmap/README.md、package.README.md、test/README.md，无官方中文主README。保存英文主README，4194bytes，SHA-256 `8cc8864325843d975f082cba0fd4cf208093feffb03568f48f164725dab8ebf9`，与安装包原文字节摘要一致。固定raw来源与响应头见official/source-evidence.json；没有翻译/格式化上游原文。
- 中文官网 `https://echarts.apache.org/zh/index.html` GET200，最终URL不变，返回`X-Frame-Options: sameorigin`和CSP`frame-ancestors 'self'`，因此明确blocked；不是unknown，更没有将未做浏览器确认冒称allowed。完整响应头、时间、字节摘要均保存。
- Demo为Canvas；Node SDK测试用真实SVG SSR。其option builder与Demo同源，但Node尺寸/序列/销毁不能代替Canvas、Observer与真实交互。

## 实际命令与日志

下表SDK/策略/类型命令cwd为`/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`；Biome和元数据命令cwd为仓库根。日志中记录完整argv、实际cwd、起止时间与退出码，日志采用非忽略`.txt`。

| 命令 | 结果 | 原始日志 |
| --- | --- | --- |
| `pnpm test:sdk --entry=A01` | exit0，3真实SDK PASS/0FAIL/0SKIP：同源轴/数据和实例更新、旧series移除恢复、折线/减少动态/resize/dispose | validation/sdk.txt |
| `pnpm test:policy --entry=A01` | exit0，8策略PASS/0FAIL/0SKIP；不作为SDK证据 | validation/policy.txt |
| `pnpm exec tsc --ignoreConfig --noEmit --module ESNext --moduleResolution Bundler --target ES2022 --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/A01-echarts/examples/demo.tsx` | exit0，仅A01入口与直接依赖，无generate | validation/entry-typecheck.txt |
| `pnpm exec biome check packages/library-lab/entries/A01-echarts/examples packages/library-lab/entries/A01-echarts/tests packages/library-lab/entries/A01-echarts/library.json packages/library-lab/entries/A01-echarts/official/source-evidence.json` | exit0，9文件，无更改 | validation/biome.txt |
| `node --input-type=module`，完整stdin程序见日志 | exit0，当前validateEntry/entryCompletenessIssues、3场景、5实际源码路径、README摘要与文档相对链接 | validation/entry-metadata.txt |

首次中途的Biome --write返回254并提示“process terminated abnormally (possibly out of memory)”，保留validation/biome-write-initial-failed.txt。没有核实精确根因，不能断言OOM；后续同范围最终只读Biome退出0。未因该工具进程异常重复SDK/策略/类型套件。

## 六项复核

| 维度 | 状态与证据层级 | 依据与限制 |
| --- | --- | --- |
| 技术准确 | PASS · 源码/类型/真实SDK |6.1.0同源option、坐标轴、系列完整替换、逻辑resize和dispose已用真实SDK；明确notMerge重置状态、SVG/Canvas及业务生成边界 |
| 解释清楚 | PASS · 静态内容复核 | guide先说明工程问题与数据流，解释每个输入/关键调用/结果，三个操作和迁移路径对应实际源码 |
| Demo有用 | NOT_RUN · 浏览器待验 | 三个独立目标有真实SDK支持；可操作Canvas、tooltip、实际隐藏/缩放/卸载仍需主控浏览器结果 |
| 源码可迁移 | PASS · 静态/类型/局部SDK | 5必要源码文件齐全，相对导入、局部CSS、固定依赖/客户端尺寸前提；保留原生命周期和门禁，真实浏览器回收未验收 |
| 官方来源可靠 | PASS · 固定ref原文/HTTP | 英文回退候选清单、4194bytes摘要、6.1.0tag/commit/date齐全；中文官网blocked与真实响应头一致，有直达 |
| 结果可复核 | NOT_RUN · 本地证据部分通过 | SDK3/策略8/入口类型/格式/metadata日志可核；核心Canvas和生命周期交互尚未跑，不能content_done |

## 主控浏览器交接

保持既有@A01 p0的region、img、按钮文案与减少动态语义。新增定位与操作：

- `a01-workshop`，`a01-chart`，后者`data-instance-id=chart.id`；`a01-total`、`a01-chart-size`、`a01-selected`、`a01-option`。
- basic：“周一阅读量 +5”→17/163，展开“查看传入 setOption 的核心配置”检查series数据；前后实例ID相同。“复位业务数据”→12/158。点击文本表格17后selected显示“阅读量 / 周一：17”，实际tooltip应对应点。
- business：“显示上周对照”默认勾选，两个表行/两个series；取消后previous-reads和上周行消失，恢复后出现。查看真实Canvas与配置共同变化，不只断言复选框状态。
- advanced：原“启动增量更新”“暂停增量更新”“缩小容器，观察 resize”“恢复宽图”“复位业务数据”“允许动态演示（覆盖减少动态偏好）”保持。播放后每次+3、1200ms节奏；减少动态先暂停、主动允许后运行；隐藏/离屏暂停仍优先。缩小后getWidth约原宽65%、height300，实例不变。
- 卸载/停止/切场景：Canvas消失，真实实例dispose、interval/Observer/rAF/事件按所有权释放；重挂不累积。可用对应instrumentation，不能只靠DOM消失证明所有清理。
- README展示固定commit英文原文；官网blocked说明与打开官网入口。窄屏无整页横向溢出，数据表自身可横向滚动。

本工作者不运行共享生成/构建或浏览器。主控统一验证后独立裁定内容状态；正式sdk/build/browser的当前收据仍需未来获准的干净提交输入，不改verification为PASS。
