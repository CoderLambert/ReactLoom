# B19 Embla Carousel复用入口

解决小组内容横滑，不负责皮肤/数据/自动播放/排序。React包、核心、reactive-utils均8.6.0 / MIT；应用只直接导入embla-carousel-react。先读library、guide、3个实际sourceFiles与local-validation，当前运行API不是新版goToNext。

保留两个独立目标：基础测量/snap-vs-slide/实际拖动与按钮键盘；高级受控增删/循环条件/reInit/恢复。删除了原business仅标题不同的重复演示，没有移除独立行为。原创文字、无HTTP/图片/Autoplay。

viewport→flex track→slide结构，ref只在viewport；slide border-box/82%/minWidth0、pan-y pinch-zoom必要。selectedScrollSnap是吸附位置，slidesInView才是卡片索引，真实slideNodes携带业务ID。读数按钮是当次getter，不是每帧状态或手写运动。

watchSlides:false，因为应用effect在React提交ID变化后reInit；默认watchResize仍在。恢复用reset代数再scrollTo(0,true)。监听select/reInit用同函数off；hook拥有destroy，应用只观察真实destroy并off/清媒体监听，不二次销毁。loop:true仅请求，内容不足时SDK回退，按真实canScroll判断。

保留allocateSlideId单调/24上限，删除与恢复不回退ID。箭头只在viewport自己持焦触发；按钮/本例箭头在减少动态下jump，手动拖动仍按SDK物理模型，不夸大全动画减动覆盖。外层轮播包括控件与slide，slide group遵循APG；局部键盘增强不是SDK内建键盘系统。真实设备读屏/触摸/SSR hydration/性能另测。

官方目标包README13872B英文未改写，固定npm gitHead和manifest8.6.0/14候选无中文记录齐。5个pure policy测试不证明引擎；真实SDK证明须实际浏览器DOM/拖动/循环/卸载，不伪造layout或mock引擎。正式三项无匹配recorder仍NOT_RUN。
