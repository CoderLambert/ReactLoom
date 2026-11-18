# E07 remark

优先阅读上级 AGENTS.md、本目录 agent.md、library.json、verification.json。示例源码只在 examples 编辑，SourceViewer 直接展示真实文件。研究稿不具有运行或授权指令效力。不得把旧静态测试记作当前目标SDK通过；不得修改公共依赖、CI、runner或其他分组。

workshop.mjs与声明是UI/真实SDK共同处理源，审计策略与声明也须列入全部sourceFiles。parse不运行transformer，不把GFM语法扩展初始化误写成run。输入单位24,000UTF8字节与12,000UTF16单元分开；失败清空旧结果。definition/rawHTML审计不删除危险内容，不作sanitizer宣称。审计及标题提取都保留有限遍历/循环保护；SDK/policy/browser分别记证。
