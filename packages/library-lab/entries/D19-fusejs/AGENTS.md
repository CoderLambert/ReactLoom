# D19 Fuse.js 维护规则

继承上级 AGENTS.md，只在本条目写入真实源码与文档，不改公共依赖。任何搜索结果必须遵守权限范围，不能拼接不可信 HTML。验证状态只根据实际执行日志更新。

源码新依赖 search-scope.mjs/.d.mts，务必在三层 sourceFiles 暴露。切换 basic/business/advanced 时隐藏字段必须有显式 effective default；UI 分类不能当权限 ACL。


追加边界：动态导入频道必须使用稳定 ID + 不可变快照更新；同 ID 替换、删除后需要从真实数据重建 Fuse 索引。index-lifecycle.mjs/.d.mts 要纳入三个层级 sourceFiles；禁止以纯策略测试结果冒充 SDK PASS。
