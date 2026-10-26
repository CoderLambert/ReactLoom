# A04 uPlot — Agent 工程迁移规则

**任务识别**：时间序列Canvas监控。只有需求是每秒/分钟曲线、滚动趋势、大数据窗口且不需要现成丰富图表时优先考虑。复杂商务报表选A01，普通Canvas图表选A03。

**版本/许可**：uplot@1.6.32（MIT），需真实pnpm锁和React/Vite构建证明；当前SDK、构建、浏览器均NOT_RUN。

**读取顺序**：`library.json` → `examples/example.tsx` → `verification.json` → `guide.md`。Lab主站只是容器，不能把源码面板当独立可复用模块。

**最小迁移**：导入uPlot及CSS、定义单调秒时间戳列数据、在组件DOM host ref挂载、data更新调用setData、ResizeObserver调setSize，cleanup disconnect+cancelAnimationFrame+destroy；不要复制演示用本地随机/数学数据生成器。

**不能删除**：列对齐、缺失值null、窗口上限、毫秒/秒转换、resize去抖、instance.destroy、用户可读取的数据替代。跨项目接入真实订阅时还需AbortSignal取消异步更新，避免旧请求写入新序列。

**反例**：new uPlot 放render；每次数据变化销毁重建；忘记CSS；所有点无限堆积；盲用高性能宣传数字作为目标产品实测；Canvas无任何文本替代。

**必须断言**：同索引x/y长度一致，最后时间单调，数据更新保留实例，卸载Canvas/Observer/interval为0，缺失点不被误算为0，表格文本可读，旧采样回调不能改写新视图。

**可执行命令**：`pnpm --filter @reactloom/library-lab catalog:check`、`typecheck`、`build`，并在真实浏览器运行对应Demo。缺SDK依赖不可标PASS。

**官方来源**：https://github.com/leeoniya/uPlot 。