# 2026-11-18 主控闭环补充

六项本地质量PASS。真实SDK7项及非作者新consumer通过；浏览器4项覆盖实例/IME/竞态、重试409、外部计时器卸载观察及官方来源。竞态/租户/取消跨450ms再次核对；卸载probe冻结时钟并在卸载前确认pending与fired基线，取消后推进450ms无回调。候选24及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/D09.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# D09 Axios 本地验证

2026-11-18，独占 `packages/library-lab/entries/D09-axios`；保留其他条目及公共 dirty 成果，不提交/推送/生成/构建。固定 Axios 1.20.0。原有三层真实示例保留，提取共享客户端并修复 pending race timer 在换租户后仍启动、StrictMode清理后拦截器未重装两处问题。新增真实响应拦截器日志与有界日志键。

## 内容六项

| 项目 | 状态/证据层级 | 依据 |
| --- | --- | --- |
| 技术准确 | PASS 静态+真实SDK | 安装包 `lib/core/dispatchRequest.js`、`Axios.js`、`defaults/index.js`、`index.d.ts` 与固定官方README核对。7项实际SDK测试；明确timeout在此adapter不生效，重试自建，租户非授权。 |
| 解释清楚 | PASS 静态 | guide选型→请求链→完整迁入→三个实验→失败清理；agent同步文件/配置/边界。 |
| Demo有用 | NOT_RUN 浏览器待主控 | 三个不同目标与实际SDK底层已验证；浏览器源在validation/browser.spec.ts，IME/代际/页面卸载须浏览器确认。 |
| 源码可迁移 | PASS 静态+定向类型 | 三个展示原件包含完整客户端和页面，无凭据/额外CSS/env；typecheck、Biome均exit0；dispose/install可重放SDK断言。 |
| 官方来源可靠 | PASS 来源/降级 | 1.20.0 tag固定提交84a9f3b9a4f3244b8c8e818f557d64c7b964fb25，树无中文README，英文原文bytes+摘要通过；中文官网GET200最终axios.rest，未确认嵌入所以unknown。 |
| 结果可复核 | NOT_RUN 完整浏览器待主控 | SDK与类型/契约检查有原始日志；完整页面结果尚待浏览器候选。不是正式收据。 |

## 实际命令与证据

cwd均为仓库根 `/home/lambert/githubRepos/lambert/ReactLoom`，pnpm filter exec 的实际cwd为packages/library-lab。

- `pnpm --filter @reactloom/library-lab exec node --test entries/D09-axios/tests/sdk.test.mjs` exit0，7/7通过，`validation/sdk.log`。实际导入Axios及显示源码fixture-client.ts，覆盖拦截器/租户/origin拒绝、StrictMode式重装、有界两次GET重试、重复故障重置、单次POST409、预取消/途中取消。
- `pnpm --filter @reactloom/library-lab exec tsc --ignoreConfig --noEmit --strict --skipLibCheck --jsx react-jsx --module esnext --moduleResolution bundler --target es2022 --esModuleInterop entries/D09-axios/examples/example.tsx entries/D09-axios/examples/fixture-client.ts entries/D09-axios/examples/demo.tsx` exit0，`validation/typecheck.log`（成功无输出）。首次未加ignoreConfig遇TS5112，按当前TS7要求重跑成功；这是定向类型检查而非全包typecheck。
- `pnpm --filter @reactloom/library-lab exec biome check entries/D09-axios/examples entries/D09-axios/tests entries/D09-axios/library.json entries/D09-axios/validation/browser.spec.ts` exit0，`validation/biome.log`。
- Node调用公共只读 `validateOfficialSources`、`entryCompletenessIssues`，并用crypto核对README SHA256和sourceFiles存在性，exit0，`validation/contracts.log`。
- 官方来源查询：GitHub ref API、对应commit递归tree、固定raw README和中文官网GET，原始来源/响应头记录 `official/source-evidence.json`；README未经改写，不格式化。

主控应复制 `validation/browser.spec.ts` 到公共e2e，在稳定输入屏障后重建并执行 `@D09`，将具体结果补到批次报告。共享catalog/typecheck/build由主控运行，此处未运行。正式sdk/build/browser三项在verification.json保持NOT_RUN；本地7项SDK通过不写正式PASS。真实HTTP网络、CORS、认证、2秒超时均未验证。
