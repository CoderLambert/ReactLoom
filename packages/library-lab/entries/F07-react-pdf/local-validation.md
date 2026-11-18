# 2026-11-18 主控闭环补充

六项本地质量PASS。策略与迁入编译、独立Buffer红绿复核。Chromium两项最终通过，覆盖真实Worker与Canvas文字像素、TextLayer翻页、缩放/大页限额、损坏后恢复、迟到读取和实际Worker终止。官网与README沿用candidate35三面板通过证据。候选36及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/F07.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# F07 本地质量检查

状态：STABLE（完成下面最终定向检查后停写）。只修改此entry，未运行共享build/typecheck/browser或生成器。正式verification仍NOT_RUN。

| 维度 | 状态/证据层级 | 证据 |
| --- | --- | --- |
| 技术准确 | PASS 静态+策略 | 实装react-pdf11 Page.js在page/scale变化调用onLoadSuccess；renderMode none不挂Canvas；width优先于height，因此使用真实viewport双轴scale门控。固定DPR1。 |
| 解释清楚 | PASS 文档 | guide选型、数据所有权、代次、几何、资源边界；SDK/自建策略/原创fixture分别说明。 |
| Demo有用 | NOT_RUN 浏览器 | 三目标首屏/逐页文字/缩放损坏恢复；源码真实Document/Page；两条可执行proposal及额外矩阵未运行。 |
| 源码可迁移 | PASS 隔离strict | 复制六原件+browser提案严格编译，Vite ?url及文字CSS声明完整。 |
| 官方来源可靠 | PASS 原字节 | 固定ca2330…packages/react-pdf README，唯一包README为英文；根README symlink不可当内容。MIT LICENSE原字节；installed react-pdf11.0.0 MIT/pdfjs6.3.289 Apache2核对。主页GET200但unknown。 |
| 结果可复核 | PASS 本地策略与来源；SDK/browser NOT_RUN | validation/commands.json保存真实cwd/argv/exit与raw；Node4/4全是policy，不调用DOM SDK。 |

关键修复：无效选择/取消也作废旧read；level keyed卸载；同bytes恢复仍新建transfer payload；巨大MediaBox先读实际viewport后限Canvas，非仅guide警告。3MiB不限制解析CPU/字体内存，DPR1牺牲HiDPI锐度。未配置密码/CMap/标准字体/WASM。忽略迟到读取不等于物理abort。

原始失败保留：首次Biome发现generation故意额外依赖，增加说明性lint抑制；首次official脚本require路径误多一级，已更正；最终提案迁入曾报Canvas DOM类型，使用instanceof修正。最终结果以最后日志为准。上游初次root README得到28bytes symlink目标，已改存真实包README；rootpackage1.0.0已替换包11.0.0。

主控待测：真实Worker/Canvas/textLayer、level卸载terminate、held读取后无效选择/reset/卸载；巨大/超高MediaBox、DPR2下实际Canvas<=1080×1440；错误恢复。卸载效果仅由SDK源码推理，不能称浏览器已测。

## 独立复核delta
Buffer子类slice共享的新增策略先red exit1，改new Uint8Array(source)后3/3 green exit0；加input.onClick先递增readTurn，打开picker即作废此前pending，原生cancel不依赖change。onChange继续处理无效选择失效。见buffer-delta-red/green.log与delta-biome.log（exit0）。这些仍是policy/静态，不替代浏览器。STABLE停写。

## candidate35真实浏览器Suspense故障delta
主控实际import已resolve但Session反复渲染，宿主Suspense不退出。实装Document/Page默认suspense=true，缓存按file身份且初挂载useMemo可能重建；明确Document/Page均suspense=false，SDK useResource走Effect/active/cleanup dispose，Document.dispose映射loadingTask.destroy；Canvas通过Page上下文false且effect清理cancel实际RenderTask。保留局部loading/error回调。suspense-delta-types/biome均exit0；未重复policy或共享build/browser，主控重建验收待执行。STABLE停写。
