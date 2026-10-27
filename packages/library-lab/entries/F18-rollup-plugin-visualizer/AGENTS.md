# F18-rollup-plugin-visualizer 条目维护

只维护本目录与EF progress。阅读上层AGENTS、library.json、agent.md以及verification.json。这里是**真实Node CLI / 构建配方**，不能生成网页假终端或硬编码假测试报告。必须由实际目标SDK/CLI执行产生证据，未运行标NOT_RUN。输入fixture全部隔离，绝不扫描/修改用户生产业务仓库；不调用安装脚本、外部收费服务或shell执行任意外部输入。

- 不得把旧 reports 当作本次构建成果；`verify.mjs`只清理本条目固定产物路径，保持main应用和其他条目不受影响。
