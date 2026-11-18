# B10 Base UI 非作者独立复核

结论：**未确认 P1/P2，无阻断**。仅新增本报告，未修改产品或公共文件，未重跑已有 SDK/policy/type/browser。实际 cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`，HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。

已读取 AGENTS、library/guide/agent、全部 examples/tests、verification/local-validation、官方原文和完整来源、validation 输入摘要/已有日志/浏览器提案；对照实际安装 @base-ui/react 1.9.0 的 Root/Indicator 类型与实现。独立核对 18 项声明输入摘要、安装 SDK 审计的四个文件摘要和 README 原文字节/hash，均匹配。

## 六项结论

| 维度 | 独立状态 | 依据与边界 |
| --- | --- | --- |
| 技术准确 | PASS（静态/匹配源码与既有 SSR） | 1.9.0 的 onCheckedChange 首参是 boolean，indeterminate 为独立 prop；SDK 生成可聚焦 span 和旁侧真实 checkbox input，name/value/disabled/inputRef 使用正确。SSR2 不证明客户端混合态或 FormData 交互。 |
| 解释清楚 | PASS（静态） | 三目标分别围绕受控勾选、批量权限、锁定与实际表单；清楚区分 SDK、手工父级、本地权限规则和后端授权。解锁不恢复已移除权限，编辑会使旧提交与 DOM 读数失效。 |
| Demo 有用 | NOT_RUN（真实浏览器） | label/Space/Tab、mixed、真实输入读数、原生 FormData、锁定和重新挂载均有对应实现与三项操作提案；真实键盘和 DOM 行为由主控运行。 |
| 源码可迁移 | PASS（静态与既有严格类型） | 四 sourceFiles 含入口、实现、纯策略及必要 CSS，无 Lab alias、新依赖或外部资产；useId 隔离标签关系，callback refs 在 null 时释放；无自建全局监听、计时器或存储。 |
| 官方来源可靠 | PASS（固定原文/HTTP 政策） | v1.9.0 annotated tag 解析到精确 commit，匹配包 manifest；1856B 英文原文及 SHA 独立匹配，根/包中文候选检查有据。官网 enforced frame-ancestors * 与 XFO SAMEORIGIN 并存，unknown 判断准确。 |
| 结果可复核 | NOT_RUN（整体客户端运行） | SDK2/policy6/类型/格式/metadata 的命令和原始日志可复用，18 项输入摘要匹配；没有把 SSR、策略或共享 build 当逐库 browser 收据，formal 三项保持 NOT_RUN。 |

## 重点核对

- `examples/example.tsx:52–59,107–110,143–150,169–180` 中 boolean 回调直接用于受控状态，不把 mixed 当第三种回调值。安装 Root.d.ts 明确 `(checked: boolean, eventDetails) => void`，Root.mjs 的 layout effect 另行设置原生 input.indeterminate；源码和文案一致。
- `example.tsx:62–83` 在同步事件内读取真正 `new FormData(event.currentTarget)`；“读取实际输入”通过 inputRef 读取 name/value/checked/indeterminate/disabled/tabIndex，并重新读取当前 form。展示结果没有从 enabled 数组伪造。父项未设 name，子项设相同 permissions name 和稳定 value；禁用项交给浏览器成功表单控件规则排除。
- `example.tsx:125–137` 同步捕获 locked boolean，再进入函数式 updater；锁定同时移除 manage，随后清除旧提交/旧读数。`permission-policy.ts` 所有入口统一归一化、去重、过滤锁定身份，父级全选也不能重新带回 manage；分母按可选项计算。解锁只恢复控件可用，不默默重新授予 manage。
- `example.tsx:104–121,142–193` 的 htmlFor/id 对应 SDK 原生 input，实际交互 Root 使用独立稳定 aria-labelledby/description；Indicator 与重复计数 aria-hidden。没有自行吞掉 Space/Enter；SDK 默认 span 与原生 checkbox 的键盘/label 联动待实际浏览器确认。inputRef callback 对 null 删除登记，应用没有额外资源需要清空。
- 现有 SDK2 是真实 ReactDOMServer/Checkbox Root 的 mixed ARIA、native input name/value/checked/disabled 静态断言，不验证客户端 indeterminate 属性、Tab、原生 Enter 或真实提交。policy6 只验证本地权限规则。三项 browser 提案使用真实控件/输入读数，不直接改 checked/indeterminate 或伪造 SDK。

## 官方与复用证据

`official/source-evidence.json` 的真实 v1.9.0 annotated tag 指向 `ad7ecda5296b0295b41a51ecb01fce6204acd099`，目标 `packages/react/README.md`。原文实际 1856 字节，重算 SHA-256 `b5444513c6b8cd0d19777a7c7f0031c8f7d287e5ce04093b5ca68e50cab791c6`，与 library/来源证据一致；根与目标包目录候选只有英文 README，未拿第三方译文冒充原文。

官网最终 https://base-ui.com GET200 的完整响应有 enforced `Content-Security-Policy` 中 `frame-ancestors *;`，同时有 `X-Frame-Options: SAMEORIGIN`。现代浏览器执行 frame-ancestors 时以该策略为准，不能只凭 XFO 将其标 blocked；也不能凭宽松 CSP 推定 Lab iframe 实际运行成功。因此 library、来源证据和 guide 保持 unknown 合理，未改宿主安全策略。GitHub/raw 自身头未冒充官网头。

已核对既有日志与声明输入，未重复有效命令。本次只读检查命令 exit0；未运行全目录 generate/typecheck/build 或浏览器。原始格式告警和后续修正记录保留，未把静态 label 告警当已复现客户端失败。

## 剩余

无新 P1/P2 修复要求。真实 label/Space/Enter/Tab、input.indeterminate、实际 FormData、锁定禁用与解锁、卸载重挂及官网 iframe 由主控针对稳定候选统一验收。读屏、触屏、完整 SSR hydration、网络授权/后端冲突和其他 Base UI 组件不在本轮通过范围。formal sdk/build/browser 继续 NOT_RUN。
