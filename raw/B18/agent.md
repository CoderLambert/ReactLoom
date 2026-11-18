# B18 cmdk复用入口

适合少量命令的搜索/分组/键盘选择。cmdk1.1.1、MIT，React/DOM19.3.0；peer18/19，实际Dialog依赖Radix1.2.0。不是搜索服务、虚拟列表、授权器或React Native组件。保留本地四文章动作，不改为用户数据/HTTP/剪贴板。

三个目标：基础查询与当前高亮/SDK读数；业务分组/快捷词/禁用与本地文章结果；高级真实Command.Dialog/门户样式/快捷键/IME/焦点和清理。五sourceFiles含新styles.css，不能只复制TSX。无Lab alias或外部资源。

Input查询不等于Item身份；Item固定save/read/copy/refresh/delete，中文标签与别名放keywords。Command.List必需，Root label建立Input/List的ARIA关系；不要假定Input aria-label覆盖内部aria-labelledby。useCommandState按search/value/filtered.count三个原始值订阅，不能返回每次新建的对象。disabled仍可匹配但不能执行，select再拒绝delete；SDK count不等于可执行数。

Dialog的className作用内部Root，contentClassName/overlayClassName分别给门户内容/遮罩。高级vimBindings=false避免内置Ctrl+K上移与应用切换冲突；内联保留默认。应用document监听只在advanced存在，拒绝已消费事件、编辑目标和组词；自己拥有的repeat组合仍preventDefault但不toggle，卸载清理。

IME保留native isComposing/229与捕获Enter保护；createImeGuard在compositionend后只尾随80ms，Enter/Space抬键、普通输入、blur清除，不无限等待keyup。原10policy保留，新增6测试窗口/归属边界；它们不证明真实OS候选窗。

Radix拥有modal焦点，应用外置触发器不在Radix Trigger内。open关闭后使用可取消0ms任务，在其FocusScope清理后只恢复无人接管的body/脱离焦点；原目标须连接，已有别处焦点不抢。打开、level离开与卸载取消任务；不用queueMicrotask假定所有关闭路径正确。不要伪传cmdk Dialog未暴露的onCloseAutoFocus或额外套FocusManager。

b18-workshop带data-level/open；b18-sdk-state是真实SDK search/selectedId/resultCount；b18-status与b18-article是fixture结果。Input按combobox在具体Command/Dialog内定位，Option aria-label保持中文稳定名称，底层data-value由SDK设置；不要写DOM伪造状态。

固定官方来源dip/cmdk@fb4ea04e9ec211777fbb39c6104e3c5f2ee107d2根README.md，目标包目录无README、无中文候选，1.1.1/14036B/hash/完整请求在official与library。旧pacocoursey官方主页真实跳转，GitHub最终XFO deny+强制CSP none→blocked。

真实SDK只运行defaultFilter与SSR形状，policy只本地逻辑；浏览器提案覆盖实际筛选/ARIA高亮身份、业务执行/disabled、真实Dialog/焦点/热键/IME事件协议/卸载。OS IME、触摸/读屏、完整SSR hydration、远程过滤/Loading/虚拟化未验收。六项/命令/剩余看local-validation，formal三项保持NOT_RUN，禁止以SDK工具函数或仓库绿CI替代实际交互。
