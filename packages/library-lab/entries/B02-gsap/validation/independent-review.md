# B02 GSAP 非作者独立复核

结论：**未确认P1/P2，无阻断**。本报告仅独立只读审查；经主控明确授权只写本报告，未修改被审源码或公共材料，未重跑有效测试。实际cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`；HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。

已读library.json、guide.md、agent.md、所有examples/tests、local-validation.md、official/source-evidence.json与原README、validation/browser-proposal.txt及既有日志说明。通过实际文件读取与SHA-256重新计算核对来源，不把作者结论当浏览器结果。

## 六项结论

| 维度 | 独立状态 | 证据和边界 |
| --- | --- | --- |
| 技术准确 | PASS（源码/版本/既有真实数值SDK） | motion.ts为Demo与SDK测试共用，实际gsap3.15.0；Tween1.2s/60px、none50%=30、power2.out50%=52.5；Timeline四卡0.6/stagger0.14尾1.02，detail标签0.7/时长0.4，总1.1。Node3复用，不代表CSS/时钟。 |
| 解释清楚 | PASS（静态） | guide区分时间比例/位移、标签重叠、视觉完成/业务成功、RM/visibility/用户意图、context所有权；合并重复business为2目标，描述与实际控件/共享builder一致。 |
| Demo有用 | NOT_RUN（实际浏览器） | 两真实目标与准确Getter快照、原生控件齐；自动时钟、CSSPlugin/DOM、RM/visibility、暂停反向与清理仍待主控。 |
| 源码可迁移 | PASS（静态与既有类型） | 五文件包含样式/共享builder/纯策略，无Lab alias；client-only与禁子树SSR明确，React不与GSAP共写transform/opacity，局部context与dispose/监听清理明确。 |
| 官方来源可靠 | PASS（固定原文/HTTP依据） | 官方3.15.0固定commit13e2b790546426a1a2e0e9b409f3f8dc6d6611f2；根README6199B/hash独立重算一致，根候选仅英文。完整官网头XFO sameorigin明确blocked，未误用raw.githubusercontent的deny代替官网依据。 |
| 结果可复核 | NOT_RUN（整体运行） | 已有SDK3/策略6/最终类型格式/metadata/提案日志与边界准确，未重复执行；正式三项NOT_RUN。原生hidden与完整运行结果待真实环境，不以策略计数补足。 |

## 重点核对

- `examples/motion.ts`确实构造paused Tween/Timeline，label和两个直接child起点0/0.7；数值测试导入同builder，不复制假SDK。Node对象的属性变化不证明浏览器CSSPlugin。
- `examples/example.tsx` owner含实例代数。重播、ease、RM变化由effect先revert旧context再建新owner；play门禁effect包含新owner输入，重新应用当前visible/userPaused意图。事件只控制已有对象，不裸建context外Tween。
- `reverse()`与resume不抹掉reversed；seek调用pause并设用户暂停。后台暂停是绝对门禁，恢复前台只允许未手动暂停者resume。native visibility若环境不支持必须NOT_RUN，提案没有替换document.hidden getter。
- RM分支不创建animation，原context先revert恢复静态可见，进度100、运动控件禁用；偏好恢复新建动画但保留用户暂停。初始media/visibility在绑定监听后实际同步，卸载各自解除。
- cleanup先disposed阻止旧回调，再`context.revert({suppressEvents:true})`；实际getTweensOf观察为0与原inline样式共同验收，不仅依赖本例dataset。未全局kill/clear/ticker.sleep，未承诺全页rAF为0。
- 初始化读取浏览器matchMedia与document.hidden，client-only/禁子树SSR限制明确，未仅凭use-client承诺hydration。
- `official/readme.md`实际6199字节，重算SHA-256为`66a79667b0538b19634b5a000a9a3debe588c98d390424e73e5d4de847270828`，与library/source-evidence一致。官网请求确为https://gsap.com/，HTTP200、X-Frame-Options=sameorigin；Standard No Charge已准确说明，不误标MIT。

## 检查边界

本次只读cat/rg/Python JSON与hash核对均在上述cwd；未执行Node SDK/policy、tsc、build、generate或browser。既有日志SDK3、policy6、types-final/format-check/metadata等exit0按相关输入未变复用。没有新P1/P2修复要求。真实CSS缓动、Timeline播放/反向时钟、原生隐藏恢复、DOM样式还原和监听资源验收均为**NOT_RUN**；主控接入提案按固定候选验证，不用fake getter，触控/读屏/设备性能仍不在已有证据内。
