# A12 react-konva 工程入口

React声明式二维场景，目标react-konva19.3.2/konva10.9.0，与React/DOM19.3.0匹配，MIT。当前recreated，原研究来源保留，不继承验收。实际examples是唯一实现。

三个目标：basic原生DOM右移/选择→同源Canvas与表；business真实拖拽预览→受限世界坐标提交；advanced稳定id增删/24上限/仅锁拖拽/响应式和卸载。数据为本地教学草图，不执行RSS/翻译服务。

必要文件example.tsx、stage-policy.ts、styles.css，demo.tsx只适配。世界620×260，卡片132×52；scale=min(1,width/620)，宽度1..4096保护；x0..488/y0..208取整，非有限回0。窄屏只缩Stage像素/scale，不改业务坐标。

React state唯一持有nodes/selected/locked，稳定id作key。onDragMove直接夹取实例，onDragEnd同时校正真实位置和state。默认非strict仅同步变动props，不要在预览时旧state覆盖。_useStrictMode与ReactStrictMode不同。背景层和文字关闭命中，虚线是数组相邻装饰，松手提交后才更新。

锁定拖拽不是只读：DOM移动/增删仍可用。允许第24节点，之后禁用并在setter再检查。删除选中后回剩余首项；空时删除禁用。level变化按原语义重置本地fixture，id序号不复用存活节点。

只渲染Stage，禁止另new Konva.Stage。react-konva负责Stage/子图元销毁；本组件只disconnect RO/cancel rAF。不因state更新手动destroy。Stage独立renderer root，错误边界需内部Konva fallback，本例没有Transformer/PNG/文字输入/HTTP/协作。

观察：a12-workshop含data-level/width/scale/selected/count/locked；a12-stage-host内真实2层Canvas；a12-table tr含data-node-id/x/y/selected；a12-status。控件“选择节点”“键盘替代：右移12px”“锁定拖拽”“新增节点（上限 24）”“删除当前”，表按钮“选中”加节点标题。

真实Node SDK2项调用公开KonvaRenderer在真实Group上同步props、替换事件和移除节点；不创建Canvas，不证明Stage/RO/命中。政策5项只坐标/范围。validation/browser-proposal.txt为完整真实Playwright提案，由主控接e2e执行；没有截图代替结果/SDKmock。

官方v19.3.2固定README与完整2候选无中文，commit/path/hash/time在source-audit.json。官网React入口SAMEORIGIN，blocked+直达，完整头保存。六项/真实cwd/command/exit见local-validation，正式sdk/build/browser保持NOT_RUN。触控/IME/读屏/大规模性能/SSR hydration未测。
