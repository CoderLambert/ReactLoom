# Immer — ReactLoom 工程实战

## 定位与适用范围

Immer 让程序在函数体里写可变语法，却产出全新的不可变状态。适合树形/深层数据、React reducer、表单编辑草稿和乐观 UI，但不负责网络请求、持久化和跨租户授权。默认自动冻结生成对象，Patch 功能需显式 enablePatches。

## 安装及版本约束

~~~bash
pnpm add immer@11.2.9
~~~

采用 2026-10-22 官方发布的 11.2.9；主要 API 已由官方 Patches 文档确认，目标运行平台仍需进行实际解析。

## 真实代码路径

实际入口为 examples/demo.tsx，完整可迁移实现为 examples/example.tsx。Library Lab 展示的代码由这两份源文件生成并计算 SHA-256；三个 Demo 场景共享真实实现，使用 level 切换学习层次。不得为文档另外维护一份看起来相同但不可运行的伪代码。

## 更新语义

produce(base,draft=>...) 记录草稿写入并对发生变化的路径进行拷贝；未修改分支可以维持引用。不要将 draft 泄漏到 async 回调或作用域外使用。结构共享是结果语义，不保证每次更新都比手写浅拷贝更快。

## 三层实战

基础：修改 section.name 并保留原状态引用，查看 revision。业务：通过稳定 RSS id 切换 read，避免按当前渲染索引误更新其他行。进阶：对尚未提交服务器的插入生成 patches/inverse，失败时 rollback；单独提供本地确认动作。

## 反例与修复

一、直接 state.section.name = 'x' 可能污染 React 旧快照；必须通过 produce/setState。二、先 await 再访问 draft，代理已结束生命周期；应先完成草稿更新，异步在函数外处理。三、只保存 inversePatches 就允许期间执行任何其他写入，回滚可能覆盖后续有效变化；应锁定该示例的冲突写入，生产应使用版本/乐观上下文。四、在 draft 对 Map/Set 更新却未 enableMapSet，会报错；需要能力再显式启用，而不是默认把大多数 polyfill 带进首页。

## Patch 生命周期

必须先 enablePatches()；produceWithPatches 返回 [next, patches, inversePatches]。applyPatches 不验证请求是否已经过期。JSON Patch 差异并不总是最短的事务变更集，也不能自动充当跨端权限验证。需要回滚时保存请求原始快照、匹配的 revision 或任务 ID。

## 实际组合

与 D07 TanStack Query 结合时，缓存所有权仍属于 query client，乐观写入发生在特定 queryKey 上；与 D10 Zustand 结合时，store 更新方法决定何时应用 produce。不要同时从 React 本地 state、外部 store、服务端缓存维护相同业务对象的三份真相。

## 边界与验收

目标 SDK 测试必须真实 import Immer，覆盖原对象未修改、嵌套引用变化、稳定未改分支、Patch 可逆及错误路径。浏览器确认点击、撤销、重置都可观察，不拿 JSON 展示等同于并发回滚正确性。

## 演示场景与预期

1. **produce 深层更新与结构共享**：子对象仅按需复制，不原地修改基础数据
2. **RSS 分组和阅读状态批量编辑**：真实 produce 更新 nested array 与 revision
3. **乐观 Patch 与可控回滚**：produceWithPatches/applyPatches 配合禁止冲突写入

## 练习与迁移

将 NewsHub 已读列表原地修改改为纯函数，并为请求409设计带版本检查的乐观更新与回滚。

## 验证分级与限制

本条目包含真实目标包 import 的示例和 Node 定向测试源码。**SDK、TypeScript、生产构建及 Playwright 本轮均未在依赖完整环境执行，状态为 NOT_RUN**。`tests/sdk.test.mjs` 必须在真实依赖安装后执行；Mock 业务数据不等于 Mock 目标库。测试成功后才能按当前源指纹绑定 evidence，不得沿用历史研究报告的 PASS。

## 官方一手资料

- [Immer 官方文档](https://immerjs.github.io/immer/)
- [Patches API](https://immerjs.github.io/immer/patches/)
- [官方 v11.2.9 发行](https://github.com/immerjs/immer/releases/tag/v11.2.9)

## 授权

该条目源码与文字为独立编写的教学材料；目标库使用上游 MIT 许可，未捆绑第三方图片、字体或付费资源。
