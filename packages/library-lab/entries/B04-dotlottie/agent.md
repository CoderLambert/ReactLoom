# B04 dotLottie React 复用指南

解决可信 Lottie JSON/.lottie 的播放，不承担 DOM 布局动画。先读 library.json、guide.md、实际 examples 与 local-validation.md。React包0.20.0依赖Web播放器0.81.0，peer为React17/18/19。运行时MIT与资产许可分开。

复制4个 sourceFiles，保留原创pulse.json与浏览器挂载前提。完整组件初始化读取window/document；服务端仅加'use client'不够，需要延迟挂载。即使JSON本地，首次引擎仍从SDK固定版本CDN加载WASM；离线部署另行许可核对并在实例前setWasmUrl，不导入.pnpm内部路径。

三个目标：基础播放/暂停/停止与真实getter快照；业务650ms本地确认与动效解耦；高级帧定位/速度/减少动态显式覆盖/损坏数据恢复。没有网络业务、Worker/GPU后端或编辑器。load才是资源完成；ready不是。读取按钮采样真实实例，策略文字不冒充实时引擎状态。

保留mayPlay三门：已load、页面可见、减少动态被遵守或明确覆盖。覆盖不能放开后台播放。停止意图单独调用stop，不能又被pause覆盖；frame输入夹取合法范围。错误听loadError/renderError，不靠ErrorBoundary；坏数据恢复重挂载真实播放器。

包装器销毁实例；应用暂停并解除自己的普通监听、媒体查询、visibility和业务timer，不重复destroy。用于验收的destroy观察器只标记旧Canvas真实事件，由SDK最终清空；StrictMode相同实例替换旧观察器。共享WASM缓存不属于单例清理范围。

官方英文README固定提交/path/哈希在library.json和official/source-audit.json，优先检查过上游目录，无官方中文候选。官网GET200+XFO DENY为blocked。六项和真实运行以本条local-validation和主控结果为准；正式收据未满足条件仍NOT_RUN，不以policy/文件完整替代SDK。
