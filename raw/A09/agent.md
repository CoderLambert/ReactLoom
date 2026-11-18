# A09 Excalidraw 工程入口

`@excalidraw/excalidraw@0.18.1`嵌入手绘白板，MIT包。当前recreated，历史来源保留，不继承PASS。先读实际example.tsx/scene-policy.ts和verification。CSS与非零容器高度必需；无服务器保存、模型或协作。

## 当前三个目标

- basic：SDK矩形工具真实指针绘制、撤销；a09-count和a09-scene读取实际非删除元素，160ms后派生，不回写场景。
- business：convertToExcalidrawElements创建3矩形/3绑定文字/2箭头，正常初始8元素。重置清空；恢复生成新骨架和新ID，不是保存快照。
- advanced：真实loadFromBlob受限导入，失败保留原图后可重试；exportToBlob输出PNG长边最多2048。只读同时锁SDK和应用写按钮，切换作废在途结果。

复制example.tsx、scene-policy.ts、styles.css；demo.tsx仅Lab重导出。导入官方index.css。langCode=zh-CN、autoFocus=false、handleKeyboardGlobally=false保留。initialData一次性，之后用API。本地恢复/导入captureUpdate=IMMEDIATELY；远端更新不要照抄撤销策略。

## 清理和输入政策

API由0.18.1 SDK构造函数交付；私有candidate仅用于StrictMode effect重放恢复，active apiRef在inactive时清空，mounted为false时不能回写或安排报告。卸载增加operationId、清报告/下载timer、撤销自有URL；不清全站存储。

导入先非空/扩展名/1.5MB，再真实SDK解析；最多200元素，无附件/图片/嵌入/其它非白名单类型，链接只接受无凭据HTTPS。这不是完整安全schema或域名审核。validateEmbeddable=false阻止SDK嵌入路径；本例导入政策不等于原生编辑器所有功能都禁用。

只读ref同步阻断写入口，勾选/取消时递增代数，in-flight导入/导出失效；readonly下载仍可用。操作完成前检查token/mounted/API身份，导入还查当前readonly。忽略是丢弃结果，不中止SDK内部工作。PNG空图拒绝，导出错误显示，URL约2秒后释放。

## 精确观察和验收

根a09-workshop含data-level/readOnly对应data-readonly、data-working。a09-count、a09-status、a09-scene（展开“查看当前元素身份、位置与文字”后读取JSON），画布容器a09-canvas。SDK真实工具标识toolbar-rectangle，实际Canvas为canvas.interactive。控件“重置当前画布”“恢复流程草图”“只读演示”“下载 PNG”“导入 .excalidraw 文件”“忽略当前导入或导出”。

validation/browser-proposal.txt提供真实绘图/转换骨架/合法与拒绝导入/PNG字节/只读与在途结果/卸载提案。主控接公共测试执行；未实跑不能填browser PASS。5项纯政策不是SDK验收。当前普通Node导入被open-color.json缺import attribute阻挡，没有为此改loader/依赖或mock SDK；Vite浏览器另验，不把Node边界冒充画布失败。

官方目标包README固定a2ec2889babf7d2295469c6d90ebe77fae57df84，en、1631字节，7候选无中文，metadata含path/version/time/hash。官网docs现重定向plus.excalidraw.com/docs/sdk，完整头无XFO/CSP，未知iframe，unknown。assets当前NOT_RUN：默认远程字体，未自托管、未实测字体/中文/PNG；旧BLOCKED不能充当当前失败证据。完整六项/cwd/command/exit/log见local-validation，formal保持NOT_RUN。
