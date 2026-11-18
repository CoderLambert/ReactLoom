# B01 Motion for React 工程入口

实际motion/framer-motion/motion-dom14.6.0，React19.3.0满足peer。入口motion/react，MIT核心API，无Motion+资源。先读library/guide、实际examples与verification。Motion不拥有业务数组、请求结果、拖放语义或焦点模型。

三个目标：basic观察visible=false后真实useIsPresent退出DOM暂留/移除；business稳定id增删/容量12/持焦归档后的提交回焦；advanced保留同DOM重排与实时系统减动。无Reorder、popLayout、layoutId、搜索、IME、HTTP或滚动条。

迁移六文件：example、presence-items、reduced-motion、card-policy、workshop.css和demo适配器。JSX与展示源同源，无Lab alias。纯策略保留，id事件里分配，nextId恢复列表时不重置。业务先删除，onExitComplete仅本例SDK观察计数。

AnimatePresence留在条件外；直接子组件key为永久业务id，内部真实motion元素。useIsPresent=false时aria-hidden/inert，归档按钮disabled；committedCards ref拒绝旧退出回调重复归档。只有被删按钮原本为activeElement才在React提交后回焦添加按钮；恢复清标记，不抢无关焦点。

安装14.6.0 useReducedMotion实际只读挂载快照，与在线/注释动态承诺冲突。应用自有matchMedia监听并成对清理；MotionConfig never禁用静态SDK策略，完整显式位移0/initial=false/duration0/layout=false跟随实时策略，不得删门闩仅复制never。常规user配置本来会关闭transform/layout，不复述旧稿“x/rotate无效”的错误。usePresenceData观察SDK custom，标准React上下文拥有实时视觉策略（退出子树也能更新）；在途动画变化仍需browser。

关键定位：b01-workshop data-reduced/data-order；b01-notice data-present；b01-visible/count/reduced/exits/empty/list；li[data-card-id][data-present]。SDK存在性与回调、业务计数分开。退出DOM可能仍在，检查活跃行应限定data-present=true；隐藏行不会再可操作。

Node SDK2为真实React SSR+Motion组件/context，policy4为纯数组规则，不是动画/焦点PASS。浏览器源码提案在validation/browser-proposal.txt，主控统一接入。完整实际命令/六项/原始日志见local-validation，正式sdk/build/browser全NOT_RUN。

官方v14.6.0 commit3397236ea600094f09513fbb2bfb084dc95f5982根英语原文7475B，完整tree无中文候选；包声明14.6.0。sha/date/path与完整官网头在official；GET200无XFO/CSP、未Lab iframe，所以unknown。未运行的硬件性能/触控/读屏不能计PASS。
