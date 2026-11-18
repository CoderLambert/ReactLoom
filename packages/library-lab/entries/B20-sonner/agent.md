# B20 Sonner 2.0.8

短成功/失败/进行中/有限撤销适合Sonner；必读风险、字段错误、任务账本不能只放Toast。MIT，React19.3宿主，实际peer覆盖18/19。SDK是React DOM，不是Native。

## 已实现三目标

basic真实toast和持续业务反馈分开，关闭/3.5s自然关闭不清result；business本地保存+最新一次的一次撤销，旧token无权撤销新保存，关闭不是撤销；advanced900ms本地fixture冻结输入，loading同id更新成功/错误，重复/取消/离开清自有timer与旧回调。没有HTTP、toast.promise或服务端补偿。

## 必须保留

Toaster id来自实例useId，toasterId路由和toast返回id分别管理；不能回退固定共享容器id。Toaster不是Portal，实际DOM位于组件树内；导入2.0.8 SDK会自动在document.head注入官方CSS，无需依赖宿主补styles.css。默认样式是全document SDK样式，不宣称完全隔离，也不删共享style。

同id更新合并旧配置；loading Infinity必须在success/error显式改duration3500，Toaster默认值不会覆盖它。hover/交互/hidden会暂停自动关闭，不能写成严格墙钟3.5秒。visibleToasts3限制可见堆栈，不是删除业务。

两个LatestRunGuard分别管任务提交与撤销所有权；应用clearTimeout是真取消本地计时，invalidate只使旧回调失效。shouldFail在启动时捕获，之后勾选改变不改本次输入。只有最新token能undo一次。每次编辑结果在role=status持续展示。

owned登记本实例创建过的id，不是活跃账本。卸载/level变更/取消仅dismiss(id)，禁止无参数全清；不清全局SDK store、样式或别人的通知。SDK拥有内部订阅/动画/计时；应用只清自己的900ms与守卫。onDismiss不是严格用户确认（程序dismiss路径也可触发），关闭/超时不提交事务。

## 迁移

pnpm add sonner@2.0.8；复制example.tsx/latest-run.ts/sonner-demo.css，demo.tsx只是Lab出口。没有宿主alias或运行资产。public level变化重置本地状态并清上轮资源。要生产撤销需真实补偿接口，关闭通知不能假装abort/回滚已完成。

## 精确操作/观察

区域“Sonner 通知真实示例”，b20-workshop/data-level。按钮“触发订阅成功提示”“保存新闻并显示撤销”“运行异步反馈”“取消并清理本演示”；复选框“模拟业务失败”。真实Toaster区域“本演示通知”，中文关闭按钮“关闭通知”，action“撤销”。空hotkey不抢全局Alt+T。b20-result、b20-saved读业务状态；b20-toast-id是最近创建id历史读数，不是当前活跃数量。真实[data-sonner-toast]的data-type/节点身份用于同id转态验证。

## 证据边界

既有6个pure guard断言不渲染SDK。新增真实SDK store用独立Node Worker，finally终止自有Worker，无DOM/RAF mock、process.exit或force-exit；只证明merge/identity/有限duration及别的container记录未改，不能证明Toaster过滤/动画/ARIA/DOM。entry validation/browser-proposal.txt有完整三条真实Playwright提案，root统一执行；读屏、触屏滑动、SSR hydration/Shadow DOM等未测。formal全NOT_RUN，日志见local-validation。

## 官方

v2.0.8 tag6739aca5f668a33a4fd1d2fd9f758dff95c57466的manifest2.0.8，README英文867B/hash0809d104ce28f9c14b3b1e73257d93096f96134d2a5f2f225e5abf38b1aa4549。npm gitHead ecce1841c55e4a72dfe139a8992b56498660125e的manifest仍2.0.7；两个commit的README/src/state.ts字节相同，差异保留不伪造版本对齐。未截断tree仅根README和test/README，无中文；时间、原文与10个完整HTTP头在official。官网GET200无XFO/CSP未实测Lab iframe→unknown，不能allowed。
