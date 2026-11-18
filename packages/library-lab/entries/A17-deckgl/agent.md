# A17 deck.gl 工程入口

目标@deck.gl/core/layers9.4.0，MIT，真实standalone Deck+ScatterplotLayer，无底图/网络/付费服务。React产品官方推荐DeckGL包装器；本例为已声明core/layers的effect生命周期练习，不引入未安装@deck.gl/react或双重所有者。recreated/历史来源保留。

三目标：basic真实GPU点/Tooltip/拾取和DOM选择；business同Deck同layer id过滤与半径trigger更新；advanced1204样本/903健康点、全量12行分页/重置/响应式/finalize。数据为本地确定性fixture，不是性能测量。选择只显示在DOM，没做GPU选中色。

迁移example.tsx、deck-data.ts、deck-layer.ts、deck-size.ts、styles.css；demo仅适配。经纬度顺序[lng,lat]，radiusUnits=pixels，shader最终半径4..28；CPU accessor max(5,sqrt(volume)*radius)。图层id固定library-sites，半径updateTriggers.getRadius，数据不可变。表格分页不改变图层数组，过滤和重置回首页、缩小时页码夹取；隐藏选择清空。

ready只由真实onLoad设置，构造返回不当GPU就绪；WebGL设备由SDK实际创建，不另建探测上下文。onError原样显示，不使用假GPU。onAfterRender读取当前匹配Layer getNumInstances/isLoaded/instanceRadius实际属性和Viewport.project；签名不变不setState。不在render回调调用pickObject引发递归拾取绘制。

RO+rAF尺寸1..4096、非正跳过、相同尺寸不写。cleanup disposed/observer/frame/finalize/ref由当前组件拥有，SDK释放自己的资源，不清全局Device。构造/初始化迟到回调都查disposed。与MapLibre组合并未实现，camera/controller须单一所有者。

观察a17-workshop data-ready/count/picked；a17-canvas真实Canvas、a17-radius/status/error/sdk-state（展开“查看真实图层、属性和投影”），a17-table tr data-site-id，a17-page。snapshot含initialized/layerId/instances/layerLoaded/width/height/radiusValues/points。instances不是视口可见点数或显存，project是SDK投影。分页上一页/下一页、原半径/健康/1200开关、重置数据保留；表格按钮“选择”加名称。

Node SDK2仅真实Layer描述符和Viewport，无GPU；政策6仅尺寸/fixture/分页。validation/browser-proposal.txt供主控接真实e2e，不mock GPU或用截图代替拾取。formal sdk/build/browser保持NOT_RUN，触控/读屏/大规模性能未测。

官方9.4.0固定提交5eded84b438eef83387dc6579c51670389053602，primary是core包109字节英文README指引，另存layers/项目原文；完整候选无中文，精确hash/path/time在source-audit.json。官网200无XFO/CSP、未iframe确认，unknown。完整六项/cwd/command/exit见local-validation。
