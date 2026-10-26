# F17 axe-core — Agent 工程迁移指南

用于自动化无障碍规则审计，不用于“自动补齐所有WCAG合规”。版本基线 axe-core 4.14.0，MPL-2.0。完整迁移需结合F13 Playwright真实浏览器与人工键盘/屏幕阅读器检查。

## 从实战源码迁移
从 `examples/example.tsx` 迁移按需 `axe.run(container,{runOnly})` 和 violations/incomplete 的结构化报告。不复制教学中故意缺alt/label/name的组件到生产。根据目标页面场景扩大规则范围；不应只选这3条就作整站验收结论。

将audit置于明确用户或测试触发的稳定渲染阶段，避免在React每次render自动扫描。扫描需要当前DOM确实已挂载，异步结果要保证代际关系，避免旧结果覆盖新页面。保存测试范围、浏览器环境、源指纹、真实console/CI报告。

## 断言合同
基础：`image-alt` 检测错误图片；修复版通过目标规则。业务：没有label时触发 `label`；关联label后消失。进阶：无名按钮触发 `button-name`，修复后组合规则无violations。还要检查 `incomplete`，不能把这三个rule无问题推成所有WCAG合规；真实浏览器执行之前为NOT_RUN。

禁止生产站点插入不可信脚本/外部扫描服务；无需付费API。官方：https://github.com/dequelabs/axe-core
