# B05 Rive React

## 适用

已有合法 `.riv`、需要状态机或 View Model 与产品状态对齐时使用 `@rive-app/react-webgl2`。简单过渡用 CSS 或 Motion。表单、付款结果和读屏文案必须留在 DOM。Canvas 只做装饰时 `aria-hidden`。

## 版本

Lab 固定 `@rive-app/react-webgl2@4.37.0`，React 19.3.0。运行时 MIT。`.riv`、字体和 Editor 导出权另计。新代码用单数 `stateMachine`。不要启用与 `useOffscreenRenderer: true` 冲突的 `enableGPUCanvas`。

## 迁移

旧教程的 `stateMachines` 和 `useStateMachineInput` 不要复制进新文件。View Model 绑定需要设计器契约；没有契约文件就不要调用 `useViewModelInstance*`。命令式 `new Rive()` 与 `useRive` 的清理路径不同，不能混用。

## 不可删的清理

播放器是子组件，卸载即释放包装器拥有的实例，不要再 `rive.cleanup()`。页面隐藏和 advanced 视口外都卸载，不只是 pause。`onLoadError` 在播放器已卸载后不得 setState。审核用 AbortController 和 generation，切换 level 时 abort。减少动画和手动暂停只停播。

## 反例

把 `cdn.rive.app` 的 `vehicles.riv` 下载进仓库。用动画帧决定审核成功。容器高度为 0。每行一个 WebGL context。包装器 cleanup 里双重 `cleanup()`。渲染期 `new Rive()`。把不存在的 `approved` 状态机写进官方样本。

复用时保留这些不变的约定：

- `src` 保持 `cdn.rive.app` 上的官方样本，不把 `.riv` 提交进仓库。
- 单数 `stateMachine="bumpy"`，`useOffscreenRenderer: true`。
- 隐藏页卸载子组件，不在包装器里 `rive.cleanup()`。
- 审核 generation 与 AbortController 一起作废旧结果。
- View Model 和 `enableGPUCanvas` 未挂载；运行时 MIT 不覆盖素材。

## 测试断言

`tests/runtime-policy.test.mts` 断言 mount 与 play 分离：隐藏页两者都假；视口外不挂载；减少动画和手动暂停挂载但不播；business 仅 pending 播放。不证明 WebGL、WASM 或 CDN 字节。

## 真实限制

已挂载：远程官方 URL、`bumpy`、离屏渲染器、本地可取消审核、视口观察器。未挂载：View Model、自有 `.riv`、GPU Canvas、焦点文本输入。离线打不开 CDN 是预期阻断。不要提交 `.riv` 来绕过它。

复用检查：

- 版本以该条目 `library.json` 为准，不跟研究稿里的 Vite 脚本或 workshop 目录。
- 未挂载的生产模式留在 `guide.md`，不补进 `examples/`。
- 不修改 `verification.json`。没有匹配 receipt 时 sdk、build、browser 保持 NOT_RUN。

## 证据

sdk、build、browser 为 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配 receipt。Actions run `41779873259` 是仓库级检查，不是本条目 PASS。文档：https://rive.app/docs/runtimes/react/react
