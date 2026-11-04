# B22 react-beautiful-dnd（历史迁移） 维护规则

先读根和Library Lab的AGENTS.md、当前library.json、agent.md及verification.json。只修改当前A/B条目，不得编辑公共依赖/CI/lockfile。演示必须使用真实目标包的接口，源码展示从examples自动产生。实际未执行SDK/tsc/Chromium不得标PASS；改动将使既有验证失效。


AB wave20：禁止在拖动中用旧index覆盖键盘/撤销/重置的新顺序；固定槽位和revision必须在最终业务写入层校验。测试纯规则不标SDK PASS。
