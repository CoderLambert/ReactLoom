# F17 工程复用

axe-core4.14.0 MPL-2.0，局部ref容器只跑image-alt/label/button-name，不是整站WCAG。复制example.tsx+audit-queue.mjs/.d.mts，React19/TS DOM/react-jsx，level key保留。生产用修复态DOM。

缺陷态必须无placeholder；实装4.14 label any包含non-empty-placeholder，旧夹具非空placeholder让business错误地0违反。修复态使用真正label htmlFor/useId，placeholder只能辅助，不能将语义建议误说成规则预测。真实 Chromium 结果为 1/1/3，修复后均 0。

同步running防重入，generation只允许当前结果/错误/finally写入；扫描中禁修复切换。模块队列串行、失败尾恢复，排队前检查token/ref/isConnected，卸载/换层失效；已启动axe.run不物理取消，无SDK destroy/Worker清理承诺。helper只协调同一模块用户，不能挡其他axe调用；悬挂引擎会阻塞后队列。

纯Node4项policy只测试队列，无规则SDK。三原件strict+Biome/raw见local-validation；正式NOT_RUN。本地 Chromium 验证命中规则、容器外缺陷隔离和卸载重挂，见 local-validation.md。

固定e797173…官方README/LICENSE/package原字节，英文无根中文候选；官网CSP frame-ancestors self=>blocked，保留直达。guide说明违反规则数≠节点数/incomplete人工复核/透明GIF原始fixture边界。
