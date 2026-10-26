# A11 Konva — Agent 复用约束

**选型**：需要原生2D场景图、框架外Canvas、精确拖拽/变换或大量节点事件。需要高层React声明式时先评估A12 react-konva，成熟产品白板优先比较A09/A10。

**版本**：konva@10.9.0 / MIT；平台未完成SDK/build/browser实测，读取验证指纹后在目标环境重跑。

**迁移文件**：`examples/example.tsx`为实际节点创建、增量状态同步、拖拽、resize与cleanup；`examples/demo.tsx`只是宿主导出。将`Card`领域数据换成目标Domain Model，保持稳定id和变更事件语义。

**必须保留**：一个Stage单一owner；ResizeObserver断开+RAF取消+stage.destroy；dragend后写回领域位置；transformend把scale并入长宽并重置；节点Map以ID对齐；Canvas之外提供键盘操作与DOM等价文本。

**禁止反模式**：React render里new Stage；render时destroy整个树；给所有节点上无限监听；用Konva坐标当数据库事实；混用react-konva另一个Root控制相同Canvas；默认导出未知跨源图片。

**验收清单**：动效与缩放真实SDK对象可操作；重复挂载无残余Canvas；拖动及键盘步进同样更新模型；Transformer resize两次几何不累乘；按需销毁无document listener；读屏可从HTML列表读到节点。无浏览器不能声称视觉效果已验证。

**命令**：`pnpm --filter @reactloom/library-lab catalog:check`，`typecheck`，`build`，专项浏览器交互及卸载测试。当前为NOT_RUN。

**来源**：https://konvajs.org/docs/index.html 。