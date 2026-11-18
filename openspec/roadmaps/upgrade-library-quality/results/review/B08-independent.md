# B08 独立六项复核（非作者）

复核者 `/root/quality_e05`；UTC **2026-11-10T13:36:13.997956+00:00**；实际cwd `/home/lambert/githubRepos/lambert/ReactLoom`，Git HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。B08实现归原作者所有。本次只读实现/资料/日志，唯一写入是本独立报告；没有修改产品、测试、公共文件或正式verification，没有重跑已有效SDK/policy/类型或共享构建。

结论：**当前有两项P2待原作者闭环；没有发现P1。** 下列定位针对本报告末尾输入摘要。原作者正在处理真实浏览器发现的样式问题，后续修改应增量复核；不得把旧候选结果套到新源码。

## 具体问题

### P2-1：真实按钮主题被宿主未分层规则覆盖

位置：`examples/example.tsx:24`导入`@mantine/core/styles.layer.css`、`examples/styles.css:1`起只配置容器/滚动/focus，没有处理这一宿主层叠前提；宿主只读证据`packages/library-lab/src/styles.css:30–39`的无层button/background/border/padding及hover。

安装9.7.3官方styles.layer.css将组件CSS放在`@layer mantine`，真实Button root通过`background:var(--button-bg,var(--mantine-primary-color-filled))`取主题。宿主普通无层button规则在正常声明的层排序中优先于这些有层组件规则；提高SDK层内selector specificity不能改变层排序。按 [CSS Cascade 5 层排序](https://www.w3.org/TR/css-cascade-5/#layer-order)，这是实际接入冲突，不是primaryColor=teal计算失败。主控报告candidate10的basic真实teal CSS断言失败，business/advanced自身case通过，与该源码机制一致；此浏览器结果是主控执行，本复核者没有重跑。

建议：原作者仅在B08修正公开SDK样式接入/实例范围内的层叠前提，使真实Button仍由SDK变量与variant/state决定背景、边框、padding和hover等必要样式；同步迁移说明。保留主题本意，不把expected改成宿主灰底规避。主控在匹配新构建重跑失败basic，必要检查局部Button变体/disabled/hover；不为纯样式修正重跑不受影响的SSR或history policy。

### P2-2：Switch的函数式updater延迟读取事件currentTarget

位置：`examples/example.tsx:165–168`，`setFeedHistory(previous => toggleFeed(previous,row.id,event.currentTarget.checked))`。

当前把可变event/currentTarget封在state updater中。实际React19.3安装`react-dom/cjs/react-dom-client.development.js:20801–20808`的executeDispatch在listener调用后将event.currentTarget置null；updater可能在排队/重放时才执行，不能依赖eager执行恰好发生在listener期间。宿主真实StrictMode也不能当事件长期可读保证。一次真实键盘PASS不证明这个闭包始终安全。

建议最小修改：在onChange函数体立即`const enabled=event.currentTarget.checked`，再把稳定布尔值传入`setFeedHistory(previous=>toggleFeed(previous,row.id,enabled))`。保留原history原子快照与no-op语义，不改纯规则。定向入口类型/现有Switch真实浏览器路径按影响复核即可，不重跑已有效数值/manager策略或SSR。

## 六项独立结论

| 维度 | 独立结论 | 证据/边界 |
| --- | --- | --- |
| 技术准确 | 除上述P2外匹配源码/类型；P2待修 | 核实际core/hooks9.7.3、MIT、core peer hooks9.7.3/React与ReactDOM^19.2，hooks peer React^19.2，宿主19.3满足。NumberInput默认number|string、decimalScale2与clampBehavior none/validQuota分工准确。Provider公开root/变量/manager配置与真实Portal/Modal默认焦点语义成立；Switch事件应捕获。 |
| 解释清楚 | 静态基本通过；主题结果需随P2校正 | 一个订阅工程问题贯穿三个目标，明确草稿/提交数值、150ms本地防抖、一步撤销、数字中间态、SDK/业务所有权和生产迁移。承认官方CSS文档级基础层，未假称Shadow DOM隔离。真实teal当前是已失败结果，不能据静态讲解标运行通过。 |
| Demo有用 | 三目标独立成立；basic当前FAIL，business/advanced主控报告PASS | basic受控确认/局部主题；business防抖、稳定行、Switch和一步undo；advanced实际NumberInput非法草稿→守卫→合法提交/取消/Portal焦点。提案真实native控件与browser Back，没有mock/fake timer/env=test。正式browser仍NOT_RUN，失败项留待修。 |
| 源码可迁移 | 五sourceFiles齐；层叠前提待修 | example/feed-history/demo/local-color-scheme/styles均存在、正常排版、无宿主alias；实例useId属性选择器、getRootElement、内存manager、Portal target成套。没有远程数据/素材/额外表单包。主题/样式须包含P2修复后的正确接入前提，SSR hydration未验证。 |
| 官方来源可靠 | 静态原文/hash与完整官网头通过 | 精确9.7.3 commit、完整tree候选36个/truncated=false无中文；目标包优先原文343B，hooks334B/root3799B分开，三sha重算匹配。GET200全头无XFO/CSP，真实Lab-origin未测→unknown合理，不推定allowed。 |
| 结果可复核 | 局部日志可靠；整体待P2闭环/匹配browser | 复用真实SDK2 SSR/初值、policy4、入口/提案类型、Biome、metadata日志，未把SSR/纯policy当数字输入/计时/Portal运行。正式verification全部NOT_RUN；主控候选结果单独引用。修复后只需影响范围增量复核。 |

## 实际源码/所有权核对

- 安装源码`MantineProvider.cjs`默认root为documentElement，本例实际传自有ref，cssVariablesSelector为useId生成的根属性选择器；`use-provider-color-scheme.cjs`通过getRootElement设置属性，force light分支不注册系统scheme监听。内存manager无外部数据源，noop subscribe不是SDK替身。没有localStorage或全局清理。
- 实际`use-debounced-value.cjs`新值clearTimer，卸载return cancel；本例只读hook实际发布值过滤，不手写第二个timer。150ms不是网络或精准绘制性能。Table key与data-feed-id均稳定永久id。
- 原history函数原子返回rows/before；no-op/unknown保留同一对象；undo只还原一次。validQuota拒绝空/减号/非number/非安全整数/越界，与测试、guide和真实NumberInput参数一致；不把min/max夹紧当提交校验。
- 实际Modal默认withinPortal/lockScroll/trapFocus/returnFocus/closeOnEscape为true，keepMounted=false。本例指定真实Portal target为自有根，SDK `Portal.cjs`查询该selector；React卸载自己的Portal内容而非删共享全局节点。useModal实际安装useWindowEvent和useFocusReturn；资源归属说明正确。没有env=test、禁Portal、禁focus或伪DOM。
- basic工作区确认纯本地。advanced实际form submit且NumberInput是text型格式化控件；错误关联输入+Alert。取消/Escape丢草稿，再edit重载行值；同值不造历史，不声称脏检查或服务端回滚。

## 来源与证据复用

固定官方commit `2d0a040f42011e791caf0bc56b9fbdd36ce55cef`，同步UTC `2026-11-10T13:15:19.335704+00:00`，language en。实际读取三份完整原文并重算：core343B `ffeb75cfc038afa93c1620b9b87fdb478c0e9239213459d2c37970ef1155cac5`；hooks334B `2d84a962bf521e3080ff3662c8c8cd99749373a5391335cd65fef9b734da9c22`；root3799B `ed3f723d83c74199aca418eb2a277f2e5ad3d34442a69fb2e9690cce3572f15e`。与library/source-audit一致。

实际读取official/homepage-response：GET200 finalUrl同https://mantine.dev/，完整头，bodyRead false，browserFromLabOrigin NOT_RUN，XFO/CSP null；unknown依据准确。没有重新获取官方源或重复HTTP。

复用`validation/{sdk,policy,typecheck,biome,metadata,proposal-typecheck,proposal-format,diff-check}.txt`已记录的cwd/实际命令/exit0。SDK2真实导入Provider/NumberInput/TextInput等SSR与hook初值，不含浏览器DOM/timeout执行；policy4仅history/配额和manager隔离。metadata首次@scope合法路径失败原日志保留，主控公共修复与条目编码/重查过程有记录，没有伪造路径规避。

本复核仅源码、类型/样式文件、日志和sha读取；没有运行任何SDK、policy、类型或浏览器检查，也没有运行全目录generate/build。主控报告的candidate10浏览器basic FAIL/business与advanced PASS是外部证据，仍须与后续实际修复输入绑定。未测包括原生OS IME/触摸/读屏、SSR hydration、完整CSS隔离、滚动锁/监听普查和性能；正式收据保持NOT_RUN。

## 本次复核输入摘要

- `examples/example.tsx`：`ece6223f6cba8670647443706191c652ae3e10f8c62f67004e6980c3c4138b1e`
- `examples/styles.css`：`9c89a14200dc00a8053fe904812abef45404438820dfb05c8e234f4bde077094`
- `examples/feed-history.ts`：`191f36bda3bce0ea608b2e34e0409fea0c9f7c07f190706efc3b3bec5f2409f8`
- `examples/local-color-scheme.ts`：`7f4ac978d8247c1c23099ce6b0a745faabedc845ac0008e6549744e898b0dbbf`
- `library.json`：`8dbb2d2b7c37bfc5bffb502a85acbd5fccb132d711f8939116dfd7661aaee73b`
- `guide.md`：`b2dc67d603480df12d05ac7fb80cf28b664285f8fd1eaf34cc723ead72ed373e`
- `agent.md`：`61b1c3ba9d81750c8091e0dc41727165c8fce4b84fd422f3cae3adf63c68fa7b`
- `verification.json`：`1ff8a605359937e3ba8342205a39ec3ade24a4462262bb2d6723f8fc070e1a9d`
- `validation/browser-proposal.txt`：`72a1ac30d79dafb31157336d37f67e8a2fdc892c394be42101db6e0eb1897b52`

后续作者修改上述任何文件时，旧静态结论仅在未受影响部分复用；该报告不阻止原作者继续独占修P2，不与其源码写入交叉。

## 两P2增量静态关闭（2026-11-10T13:39:20.962722+00:00）

已只读核对原作者最小修正：Button公开UnstyledButton类仅对font/background/border/border-radius/padding/cursor/opacity逐属性revert-layer，Input仅font；没有all重置、硬编码teal或公共源码变更。相同实例根同时包含真实Portal。此选择把宿主无层冲突属性回退到官方mantine层，variant/state继续来自SDK；真实主题/hover/disabled焦点结果留待匹配构建验证。原作者css-property-probe明确临时注入只是诊断，不伪称最终新构建PASS。

Switch现onChange立即捕获enabled布尔值，updater不再读event.currentTarget；原history未改。guide/agent/本地记录同步迁移前提，css-handler-typecheck与css-handler-format实际exit0有效复用，未重复SSR/policy。两P2静态关闭；原candidate10 basic失败历史保留，修正后真实三case由主控candidate11定向验收，本复核未运行浏览器，formal仍NOT_RUN。
