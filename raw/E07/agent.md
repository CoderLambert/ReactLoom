# E07 remark 迁入指南

适用Markdown结构分析、GFM规范化、发布前只读URL审计；输出仍是Markdown，不是HTML/安全发布产物。remark15.0.1与remark-gfm4.0.1实装MIT/ESM。

## 完整迁入

已有React/TypeScript浏览器宿主运行`pnpm add remark@15.0.1 remark-gfm@4.0.1`。复制example.tsx、workshop.mjs/.d.mts、audit-policy.mjs/.d.mts，demo.tsx仅Lab转发可省。无CSS/Provider/env/账号/网络。纯Node只用workshop与audit两个mjs，不依赖React。声明文件不能遗漏，否则TS无法正确识别helper。

workshop是UI与真实SDK唯一处理实现。先检查24,000 UTF8字节→remark().use(remarkGfm)→parse一次→自建audit→同一ast stringify。parse初始化语法扩展但不run transformer；新增转换后应run/runSync取得最终树，再让审计与输出共享它。不能额外process再次parse或审计旧树。

## 边界与操作

basic标题/列表，business GFM table/tasks/delete，advanced URL/direct+definition与raw HTML。audit只读，定义包含未使用定义，links不是实际点击次数。标题由text/inlineCode/图片alt组成。safeReference只是本地语法标签，不代表可信域/隐私/浏览器安全，HTML和危险URL仍留在输出。

输入框12,000 UTF16单元不等于24,000 UTF8字节；后者不是24KiB。8,001中文字符可通过输入框但触发处理上限。处理错误必须setResult(null)，不能留下旧成功；换level/恢复案例清空状态。键击只修改输入，输出是上次点击快照。

audit显式栈上限4096、WeakSet拒绝循环/共享节点；nodeText也独立限额避免heading绕过。该策略不是任意对象/AST完整schema，不是sanitizer/ACL。节点预算在parse之后，不是严格CPU时限；需要大文档实时处理另设计Worker。

结果只作为pre文本，不做dangerouslySetInnerHTML、img或a标签；不得为了演示抓取remote图片。HTML发布走另一个净化管线，URL规则单独审查。没有监听器/定时器/Worker/存储资源，状态交React管理，换场景effect重置即可。

## 验证与来源

SDK5目标导入真实remark与同源workshop：结构/GFM/rawHTML+定义、parse-vs-run、精确UTF8边界；policy单列。浏览器提案验证全目标、恶意输入只文本/无追踪图请求、超字节错误清空旧输出/恢复。未执行browser不记安全PASS，正式各项无匹配receipt保持NOT_RUN。

官方README来自固定15.0.1的packages/remark/readme.md（对应实际包，不用monorepo概览冒充），英文原字节+许可/官网响应见official；无官方中文对应README回退en。主页unknown，响应200不等于Lab嵌入确认。完整命令/日志与六项分层见local-validation.md。
