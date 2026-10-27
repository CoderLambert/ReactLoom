# A12 react-konva — Agent 使用指南

**适用**：React声明式2D场景，已有状态管理、画布图元需要点击、拖动和刷新。若需要Konva原生可变场景树，选A11；完整协作白板考虑A09/A10。

**固定兼容**：react-konva 19.3.2 + konva 10.9.0 + React/ReactDOM 19.3。对React19.2/18必须重新核对官方兼容矩阵，不可仅提升react-konva版本。

**复用**：从`examples/example.tsx`提取useStageWidth、node DomainModel与Stage/Layer/图元结构；保持稳定id；`onDragEnd`写回领域状态；对外提供DOM列表/按钮以支持键盘与读屏。

**必须清理**：ResizeObserver和rAF、业务事件、外部ObjectURL。Stage销毁依赖React卸载；不要在effect里再用`new Konva.Stage`竞争同一Canvas。

**反例**：React列表key用index、状态频繁重建Stage、拖动时强制重置图元、只绘制画布不提供文本替代、误把stage像素坐标当持久世界坐标。

**测试**：查看`verification.json`的真实SDK/build/browser证据，运行`catalog:check`、`typecheck`、`build`、Chromium实际交互；确保dragend/按钮变动同一模型，ResizeObserver释放、无残留Stage。

**来源**：https://konvajs.org/docs/react/index.html。当前验证 NOT_RUN。
**2026窄屏补充**：迁移`stage-policy.ts`，ResizeObserver遵从宿主实际宽度；Group拖拽在局部世界坐标clamp，不持久化屏幕坐标。节点限24个，键盘替代操作一致。窄屏Canvas和StrictMode仍待真实验收。
