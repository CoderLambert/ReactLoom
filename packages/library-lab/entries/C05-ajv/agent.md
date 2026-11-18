# C05 Ajv 接入指南

实际 `ajv@8.20.0`、MIT。使用可信 JSON Schema 校验订阅导入 JSON 描述，既有 JSON Schema 合同时优先；不会抓取 URL、解析 RSS/OPML XML或管理表单焦点。

迁入六源：example/demo、共享 schemas.ts、rss-policy.mjs/.d.mts、styles.css。Schema 在模块级 compile，一组 validators 重复调用；UI 与 SDK 测试使用同一真实合同。保持 strict/allErrors 开启、coerceTypes/useDefaults/removeAdditional 关闭，别把 boolean 成功说成生成过规范化 DTO。

三个目标：Feed 的 HTTPS前缀/属性合同→自建凭据拒绝；Batch uniqueItems比较整个对象→helper按URL身份去重；Window if/then条件必填→公共properties始终限定整数1–8。strictTypes允许继承父object上下文，不机械在每层加type或关闭strict。URL canonical键不替换输出字段，不做SSRF授权。

JSON语法失败不调用SDK；结构失败不执行业务策略；阶段在data-stage区分，errors立即转显示值以免下一调用覆盖；编辑/换样例/场景清旧结果。实例useId、textarea scoped border-box、焦点样式齐，React无额外资源清理。需要异步查重或standalone编译时另设计，不声称当前已实现；严格CSP不要放宽来迁就运行时动态编译。

先读local-validation的实际命令/exit/输入摘要，再读独立review和对应candidate browser。SDK3直接验证共享合同，policy3只证明自建策略。正式sdk/build/browser没有clean authorized commit收据时保持NOT_RUN。官方原文13781B、固定commit/版本/语言/候选/完整头在official/source-audit.json，官网unknown有依据，原文不格式化或自行翻译。
