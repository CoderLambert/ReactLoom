# F16 dependency-cruiser — Agent架构守卫手册

场景：审查层级依赖、循环关系、越界模块引用。不是体积分析器、未使用依赖清理器或运行时故障工具。基线dependency-cruiser@18.5.0，MIT；请核对目标Node版本、解析方式和真实CLI报告。

**最小迁移来源**：examples/workspace/config.cjs、examples/workspace/{basic,business,advanced}/src和examples/verify.mjs。先只迁移命中目标架构的必要规则，不复制虚构路径或三个故意坏掉的fixture到生产项目。

执行顺序：
1. 从目标仓库真实路径设计 from/to 正则，明确domain、ui、infra的边界。
2. 首先用真实CLI输出json检查是否正确识别入边、出边；为已有合理例外建立书面理由。
3. 添加no-circular rule并标明检测范围，区分工具发现的静态环与实测运行错误。
4. 选择应用CI增量路径，确定错误级别/退出码，保留实际报告供审查。
5. 必须运行positive和negative fixture，验证bad case确实非零，不能只检查config文件存在。

**禁止**：对用户全部源码执行无明确许可的自动删除；只靠热力图宣称架构健康；人工制造JSON报告冒充真实CLI；将允许的跨层业务特例全部消灭。

必要验证命令：node entries/F16-dependency-cruiser/examples/verify.mjs（在packages/library-lab根运行），包括真实包导入与CLI。当前NOT_RUN/BLOCKED，详见verification.json。官方：https://github.com/sverweij/dependency-cruiser
