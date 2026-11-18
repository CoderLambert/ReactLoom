# B03 react-spring 工程入口

用 @react-spring/web10.1.2（MIT）把React状态目标变成可中断的局部运动、让稳定ID列表进出场。Lab React19.3.0；匹配安装包和tag的peer支持16.8/17/18/19，不能照旧文写v10只支持19。peer兼容声明不是跨React版本已测。CSS静态hover、Motion布局、GSAP时间线、dnd-kit排序各按问题选。

三个目标：basic布尔目标→useSpring→animated DOM；business权威数组与安全视觉离场；advanced局部减少动画/系统同步与容量键盘焦点。新闻是本地fixture，无远端服务。迁移example.tsx、article-policy.ts、styles.css，demo.tsx仅Lab适配；保持真实web入口和CSS，不依赖宿主类名。

不可删约定：

- useTransition从@react-spring/web导入，keys使用item.id。第三参transition.phase仅表示SDK阶段，逻辑存在性取当前articles。
- 离场节点可由SDK保留，但本例同提交移除按钮、aria-hidden和inert；不能等onRest才撤操作。
- MAX_SPRING_ARTICLES=12，唯一ID追加，reset不回退nextId；权威数组只一份。
- 删除持焦按钮才迁移焦点，layout effect等待提交重新启用添加；兜底到可用reset。未持焦不抢焦点。
- effective=systemReduced||localReduced；本地开关只opt-in，不能关闭系统偏好。matchMedia change移除自己监听，不调用Globals.assign；官方useReducedMotion会写全局skipAnimation。
- useSpring/useTransition hook拥有并在卸载停止Controller；未来自建命令式Controller自行stop，不干预其它实例。

控件：收起/展开视觉强调（b03-toggle）；添加一条新闻（上限12）、恢复默认数据、移除+新闻标题；advanced仅本例减少动画。b03-workshop暴露data-reduced/system-reduced/count；b03-card为真实动画DOM，b03-list-status和b03-authority来自业务state；行data-article-id/active/phase由数组与SDK分别提供。离场仍可暂留DOM，断言操作不可用和随后卸载，不用数组计数冒充动画完成。

反例：从React导入useTransition；index key；每帧setState/网络保存；离场按钮继续Tab；局部Globals修改；业务删除依赖onRest；把peer支持写成已测。未实现指针跟手、异步通知中心、拖拽、SSR和触摸/读屏验收，不扩写不存在的路径。

真实Node SDK2通过SpringValue公开advance手动驱动真实积分，覆盖物理收敛/immediate/cancel，不是hook/DOM或浏览器帧验收。policy5仅容量/唯一ID/焦点目的地，不能证明真实focus。完整真实browser提案在validation/browser-proposal.txt，主控运行；正式verification三项保持NOT_RUN。

官方原文：v10.1.2 commit59b1e5306402d3039120e2da464b66e10b1a1aa1，主targets/web/README.md原文41B，root README3525B另存；完整候选未发现中文。hash/path/version/lang/time在official/source-audit.json。官网200完整头未见XFO/CSP但iframe未测，unknown；不写allowed。详见guide与local-validation。
