# B14 Pragmatic drag and drop 复用入口

适合在现有DOM上接原生拖放，核心1.8.1 / Apache-2.0，框架无关。先读library/guide、实际3个sourceFiles和local-validation；公开导入/element/adapter、/combine、/reorder按安装类型核对，不把新主分支文档直接套回旧版本。

三个独立目标：基础三行手柄/真实DOM与键盘按钮回退；业务五行固定位置不被跨越；高级两个真实独立scope实例+一次撤销/会话revision。按钮是自建键盘回退，不声称SDK自动键盘拖动或真人读屏已通过。fixture只是内存数组，无网络或外部资源。

源/目标各带scope/type/id，canDrop与canMonitor都过滤；monitor取最内层dropTargets[0]，确认当前会话activeId/revision/level再走业务锁定规则和真实SDK reorder。浅绿目标不是业务权限承诺。basic拼回隐藏尾部，稳定key保行身份；reset/undo必须使旧drop失效，无变化不制造撤销点。

行effect combine清理源与目标，列表effect detach monitor并清会话；scope来自useId，每个实例独立。长期回调用ref读取最新数组/重排，commit同步React和ref。不要模块顶层注册、混绑另一套DND，或把scope当授权边界。触摸设备/虚拟滚动/服务端并发不在本例覆盖。

官方README原文和固定commit/path/版本/语言/时间/hash在official与library.json。Node2只真实reorder/combine，policy12只锁定和会话；原生拖放/隔离/卸载需匹配浏览器候选，不以policy或SDK工具函数代替DOM运行。正式sdk/build/browser无匹配recorder仍NOT_RUN。
