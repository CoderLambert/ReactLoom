# D19 Fuse.js 维护规则

继承上级 AGENTS.md，只在本条目写入真实源码与文档，不改公共依赖。任何搜索结果必须遵守权限范围，不能拼接不可信 HTML。验证状态只根据实际执行日志更新。

源码新依赖 search-scope.mjs/.d.mts，务必在三层 sourceFiles 暴露。切换 basic/business/advanced 时隐藏字段必须有显式 effective default；UI 分类不能当权限 ACL。
