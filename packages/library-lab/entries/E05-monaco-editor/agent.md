# E05 Monaco — 工程手册

## 适用

需要编辑、补全或语言诊断的开发者界面。只读片段用更轻的高亮。移动端完整编辑先做单独验证。

## 版本

`monaco-editor@0.57.0`，MIT。Worker 入口是 Vite `?worker`。其它打包器要重写 `examples/workers.ts`。

## 迁移

一起复制 `example.tsx`、`workers.ts`、`worker-lease.mjs`、`resource-cleanup.mjs` 和类型声明。模型 URI 保持唯一。不要把 `MonacoEnvironment` 无条件写成全局赋值。

## 不可删的清理

使用 `createOwnedResourceCleanup`。observer、两个监听、editor、model、worker 租约都放进 `owned` 再创建下一步。任一步抛错也要继续释放后面的资源。先释放视图和模型，再 `releaseWorkers()`。不要覆盖别人的环境映射。

## 反例

- render 期间 create。
- 固定 URI 导致模型已存在。
- 只 dispose editor。
- 覆盖页面已有的 `MonacoEnvironment`。
- `automaticLayout` 再加一套 observer。
- marker 回调不比较 URI，卸载后仍 setState。
- 执行或自动上传编辑器文本。
- 把 Vite worker 导入抄进 Next。
- 用清理器的 Node 单测代替 Worker 已退出。

## 测试断言

- 清理顺序固定，中间抛错仍会调用后续 dispose 和租约释放。
- 第二次安装环境在映射仍被占用时失败。
- 浏览器：标记只跟当前模型走；反复进出后 `getModels()` 不增长；网络面板没有静默的主线程回退。
- 容器高度为 0 时记录为失败或等待尺寸，而不是当成已布局。

## 真实限制

dispose 模型不等于语言 Worker 线程已销毁。`automaticLayout` 在本示例是关闭的。JSON 诊断依赖 Worker，单测没有它。

## 证据

没有收据不要写 PASS。锁文件里已有 monaco，缺的是本条目的 Worker / CSP / 浏览器收据。
