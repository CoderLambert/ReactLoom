# C02 Zod 本地质量整改

Owner / 实际 cwd：root，仓库 `/home/lambert/githubRepos/lambert/ReactLoom`；Lab命令cwd为其 `packages/library-lab`。保留原三个场景、业务边界和同步提交模型。修改输入与输出讲解、去掉未实现功能和维护历史，抽取实际共享Schema，SDK直接验证页面合同而非相似副本。

| 六项标准 | 状态 / 证据 |
| --- | --- |
| 技术准确 | PASS（限定本地SDK）；[SDK 4项](validation/sdk.txt)直接导入schemas.ts；[policy4项](validation/policy.txt)仅helper，URL输出只trim与canonical身份键分开。 |
| 解释清楚 | PASS（静态）；guide围绕订阅导入、最小接入、三个目标、输入/处理/结果/取舍；不把JSON元数据说成XML解析。 |
| Demo有用 | NOT_RUN（真实浏览器待主控）；三目标有正反例/恢复/精确路径/旧结果失效，公共e2e/quality-remediation-zod.spec.ts已写，未把文件齐全当运行。 |
| 源码可迁移 | PASS（限定入口strict检查）；五源齐，SDK/UI共享schema；无网络/资源/外部订阅，textarea标签和错误路径可用。 |
| 官方来源可靠 | PASS（原文/版本/HTTP）；npm无gitHead，实际ls-remote v4.6.5固定59bbc03e…并核package版本；目标packages/zod README原文与SHA；docs-v3中文不冒充v4。实际GET记录见official/source-audit.json，官网unknown保留。 |
| 结果可复核 | NOT_RUN（整体浏览器与独立复核待完成）；实际命令/exit见validation/local-runs.json、输入SHA见input-hashes.json；正式verification保持NOT_RUN。 |

## 已运行与保留的失败

SDK与policy各4PASS，strict入口0。首次将测试改为共享schema导入但文件未建时真实RED见sdk-source-red.txt，随后sdk.txt GREEN。原控制字符拒绝正则触发Biome，保留规则并加精确解释注释，biome-fixed.txt exit0；没有删规则。只改文档/来源后复用这些输入未变的已过检查。

fetch-official.py首次因npm没有gitHead而exit1，fetch-initial.txt保留；实际v4.6.5 tag随后解析为59bbc03e10c636b9eb3c393dfeb552819774ec21并核版本完成。完整npm/tree/manifest/README/首页与官方docs-v3中文候选响应头、摘要、版本选择理由见source-audit.json；没有伪造官方中文译文，没有从iframe load或缺响应头推导allowed。

## 运行边界

Node真实Zod4.6.5、policy独立；DOM/状态转换尚待实际浏览器；未执行网络导入、异步refine、RHF resolver、CSP编译器或真实设备输入法。本例无这些功能，不把它们列为已覆盖。完整sdk/build/browser正式收据需clean authorized commit与正式记录器；本地整改不为记证擅自提交。

文案复核更正：metadata.txt中的14 file为人工计数笔误，实际input-hashes.json为12项；保留原日志，按12真实输入计数。SDK代码/Schema未改变。

## candidate15 主控本地质量闭环

本条目适用六项均已通过。candidate15输入f76964af6e3bfa520b3e9e1d78c67a00b09713e1987c8adcce994b46c3e53857，公共/e2e lint/type/build/catalog0且changed=[]；固定dist真实browser29项26PASS/3FAIL，三个失败只属于尚未完成B22。本条目实际通过范围和独立处置见路线图results/C02.md；旧作者摘要为各自阶段历史，新主控输入摘要见validation/controller-input-hashes.json。正式三收据仍NOT_RUN，不是生产/真人最终验收。
