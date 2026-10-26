# React Hook Form：RSS 订阅编辑的三层实战

> C01 · 研究版：7.89.0（与 ReactLoom SPA 模板一致） · MIT · 当前源文件为本次独立实现，尚未完成真实 SDK、构建、浏览器验收。

## 适用与边界

React Hook Form（RHF）是**表单交互与校验状态的所有者**，不是网络缓存、认证、通用 UI 组件或 JSON Schema 生成器。适合大量非受控字段、动态订阅源和服务器字段错误；两个简单输入框可直接用原生 HTML Form。

## 安装与引入

```bash
pnpm add react-hook-form@7.89.0
```

```tsx
import {useForm, useFieldArray} from 'react-hook-form';

type Draft = {group: string; sources: {name: string; url: string}[]};
const {register, control, handleSubmit, setError, formState: {errors}} =
  useForm<Draft>({defaultValues: {group: '技术', sources: [{name: '', url: ''}]}});
const {fields, append, remove} = useFieldArray({control, name: 'sources'});
```

完整、可迁移的实现文件是 [examples/example.tsx](./examples/example.tsx)，Lab 的 [examples/demo.tsx](./examples/demo.tsx) 仅重新导出。这两个文件是源码面板唯一来源。

## 三个实际使用层次

### 入门：注册与字段级反馈

维护分组名和一个 RSS URL，输入校验通过 `register` 和 `handleSubmit` 执行，错误从 `formState.errors` 呈现。浏览器 `type=url` 是辅助，不替代 `validateHttps`。禁用和焦点状态以原生属性表达，不仅靠颜色。

### 业务：动态订阅源

`useFieldArray` 返回的 **`field.id` 用作 React key**，不要用数组下标；动态字段名使用 `sources.${index}.url`。删除最后一条来源被示例禁用，实际生产可用 Zod 或后端规则要求至少一条。重复 URL 通过业务校验反馈到 `root.server`。

### 进阶：异步字段错误与取消

输入 `https://example.com/duplicate`，本地 fixture 模拟服务端 HTTP 409，调用 `setError('sources.0.url', ...)` 和 `setError('root.server', ...)`。**演示不会发真实 HTTP 请求**。请求使用 AbortController；generation 标记阻止取消或卸载后旧响应回写。此机制在真实请求中应由 API Client 与服务端协作。

## 关键生命周期与状态归属

- Query/Loader 持有服务端记录，RHF 持有编辑副本；不要把每次按键同时写两套缓存。
- `defaultValues` 是基线。异步读取初始记录后用 `reset(record)` 或明确的 `values` 方案；服务端刷新不能悄悄覆盖用户脏字段。
- 无必要不将原生输入转为完全受控组件；第三方受控组件才使用 `Controller`，并正确透传 value/onChange/onBlur/ref。
- `setError` 应基于服务端字段路径做白名单映射；不能将服务端任意字段名直接注入表单状态。
- 中文输入法组合输入期间不要每键规范化并回写 DOM。本示例仅防止组合态 Enter 意外提交。

## 三个真实反模式

1. **数组用下标作为 React key**：删除第二行时可能将下一行的输入状态错误复用。正确做法：`key={field.id}`。
2. **表单重新加载就 reset**：正在输入的内容被服务端刷新覆盖。正确做法：定义数据所有权，必要时保留 dirty fields。
3. **请求返回不检查身份就 setError/reset**：切换条目或取消后旧结果覆盖新表单。正确做法：AbortSignal + generation 校验。

另需避免只用红色表达错误、把 `isSubmitting` 当成幂等保障（后端仍需幂等/唯一索引）、用客户端 URL 校验代替 SSRF 防护。

## 与其他库组合

C02 Zod 管运行时约束，RHF 管字段/错误与提交；若采用 `@hookform/resolvers`，应确认 resolver 与 Zod 主版本兼容。C04 JSON Forms 负责 JSON Schema 驱动的表单生成，本例没有动态生成 UI。

## 学习练习与验证要求

将本地 fixture 替换成内部 API，分别覆盖“成功保存并更新 dirty 基线”“字段422/409”“服务器500/超时”“中途关闭弹窗”“两次请求乱序”；动态数组删除/新增后焦点和字段值仍正确。用 Playwright 实测中文 IME、屏幕阅读器提示。

**当前状态**：源码已编写；SDK、类型、构建、浏览器均未验证。历史研究资料的通过记录不迁移为本条证据。参见 [verification.json](./verification.json)。

## 官方资料

- [React Hook Form](https://react-hook-form.com/)
- [useFieldArray](https://react-hook-form.com/docs/usefieldarray)
- [setError](https://react-hook-form.com/docs/useform/seterror)
- [reset](https://react-hook-form.com/docs/useform/reset)
