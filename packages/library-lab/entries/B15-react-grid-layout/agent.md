# B15 react-grid-layout 2.3.0

二维离散格子仪表盘用RGL；固定CSS布局、线性分栏B16、列表排序不是本例。RGL2.3.0/react-resizable4.0.2均MIT，React19.3；实际peer分别>=16.3.0/>=16.3，声明不等于跨版本已测。v2入口width/layout+grid/drag/resizeConfig，自带类型，旧WidthProvider/data-grid仅legacy。

三目标：basic真实容器测量与只读12/6列；business真实标题拖动/se缩放/回调与受控几何回写；advanced宽窄独立草稿、static/键盘锁与重置。只本地新闻卡片fixture，无数据请求/存储/下载导出。

必须保留：

- useContainerWidth({measureBeforeMount:true})；默认false时mounted初值true/width1280，不能据默认mounted说已实测。测量容器不额外padding，网格内边距默认沿margin10。
- i=React key稳定业务id；x/y/w/h是格子，rowHeight78/margin10。projectCells只投影边界，verticalCompactor负责碰撞/压缩；回调只读映射写当前断点。
- wide12和narrow6分开存，<640按真实容器切；GridLayout key=breakpoint。相同几何不加changes。原生容器select改变CSS maxWidth580，RO实测，不伪造width。
- drag handle只标题.lab-grid-handle，按钮.lab-grid-control在外；bounded true、resize se。SDK stop计数只真实指针回调，按钮自建键盘替代不冒充SDK键盘拖放。
- advanced locked headline写static，onLayoutChange再用上一帧坐标防御，纯键盘拒frozen；窄屏交换不跨锁邻居。reset恢复两份布局/解除锁/清本轮SDK计数，但不改容器宽度，changes仍累计。

迁移demo/example/layout-policy/styles和清理patch五文件，另保留RGL与react-resizable两官方CSS。无Lab alias/远程资源；焦点、内容滚动和reduce-motion CSS必要。Hook自己取消RAF/debounce timer/disconnect RO，网格清自己的指针资源；应用无全局listener/timer。SSR hydration/实际清理仍需验收。

观察region“React Grid Layout 实际看板”，b15-workshop data-mounted/breakpoint/cols，b15-container、b15-card-headline/feed/queue；b15-layout当前几何，b15-state真实width/两份model/changes/sdk stop计数及最后item。控件容器宽度auto/narrow、重置宽窄布局、锁定新闻总览，方向/缩窄/加宽+卡片中文名。完整真实提案见validation。

真实SDK3 core数值/Hook SSR与policy6分开，不当DOM/拖动/RO PASS。局部日志/六项见local-validation，formal全NOT_RUN。官方2.3.0 tag99f88f...→commit9b01a614bcdd13e7e921cf3f4b1c7e77942421c1，与npm/manifest匹配；唯一README英文42045B/hash等在official，GitHub Pages200全头无XFO/CSP未实测iframe→unknown。

本例依赖上游2.3.0+本地edge-scroll cleanup patch；五个sourceFiles含react-grid-layout@2.3.0.patch，必须配置pnpm patchedDependencies并install，不能只复制四源而丢补丁。具体配置见guide末节；不把上游原文改成自建补丁说明。
