# F03 Papa Parse — Agent 实施手册

**适用**：浏览器/Node CSV 格式解析与导出，不是 XLSX、不负责网络上传。建议先读 `library.json` 与真实 `examples/example.tsx`，并在目标项目验证输入编码、字段安全。

**依赖**：papaparse 5.7.0、@types/papaparse 5.5.2（后者仅类型）；许可 MIT。PLATFORM 安装锁定版本前不要标 PASS。

**迁移**：保留 `Papa.parse<T>({header:true,skipEmptyLines:'greedy',dynamicTyping:false})` 的 `errors/meta` 检查、字段验证与 URL 策略、重复规范化；保留 `Papa.unparse({escapeFormulae:true})` 的公式防护，不直接迁移示例 UI。生产不信任用户 CSV。
**生命周期**：样例的 file.text 只用于限量本地 CSV；异步文件读取使用 generation 避免卸载旧结果回写。真正大文件需 step/chunk、背压和业务取消策略。
**负例**：split(',') 手拆、忽略引号换行、以 dynamicTyping 转全量 ID、把 Markdown/XSS sanitizer 当 CSV 公式过滤、不校验 URL 就后端抓取。
**验证**：真实包 Node 集成文件 `tests/node-scenarios.test.mjs` 含引号换行/错误字段/escapeFormulae；还需TS构建和真实 File API E2E。当前新代码未运行 SDK、build、browser。
关联 F02/F04/F05；官方 https://www.papaparse.com/docs。
