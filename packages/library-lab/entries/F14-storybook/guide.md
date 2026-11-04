# Storybook 10.6.1｜CSF3 故事在源码里，页面不挂载画布

Lab 锁定 `storybook@10.6.1`、`@storybook/react-vite@10.6.1`、`@storybook/addon-a11y@10.6.1`（MIT）。示例是一条状态卡和四则故事。它不是产品 Storybook（SPA 6006 / SSR 6007），也不读取那两个 MCP。

执行种类是 `node-ci`。三个 level 的入口都是同一份 `StatusCard.stories.tsx`。页面展示的命令是：

```bash
pnpm exec storybook dev --no-open -p 6029 --config-dir entries/F14-storybook/examples/.storybook
```

网页只展示这行，不启动 6029，也不在主站里渲染 `StatusCard`。命令真的跑起来之后，才有 iframe 和 play。没有收据时 sdk、build、browser 保持 NOT_RUN。

Actions 41779873259 的构建和 45 项 Playwright 不是 `storybook dev` 或 play 的收据。`parameters.a11y.test: 'error'` 只是配置。没有 addon-vitest 或 test-runner 的执行记录时，它不会让规则失败变成红灯。

## Lab 当前示例

| 文件 | 作用 |
| --- | --- |
| `examples/.storybook/main.ts` | stories glob、a11y addon、react-vite、空的 staticDirs |
| `examples/.storybook/preview.ts` | controls 展开；a11y 测试设为 error |
| `examples/components/StatusCard.tsx` | 归档状态机 |
| `examples/stories/StatusCard.stories.tsx` | Basic、Business、Advanced、Recovery |

`staticDirs` 是空数组。没有图片、没有远程字体。不要往这里加用户文件。

## 1. 什么时候用

一个组件的具名状态：待处理、成功、禁用、失败后仍可重试。跨页登录、真实网络和多路由用 F13。纯函数用 F12。规则引擎本身是 F17；这里的 addon 只是接入点。

不要把 Storybook 当成设计稿的像素合同，除非另有视觉测试。本页没有。

## 2. 模型

CSF3：`meta` 满足 `Meta<typeof StatusCard>`，故事是 `StoryObj`。标题 `Library Lab/F14 StatusCard`。`tags: ['autodocs']`。默认 args 是「新闻源审核」、`tone: 'neutral'`、`onArchive: fn()`。

组件内部：

```text
tone === 'blocked' 或正在保存或已完成 → 按钮禁用
点击 → generation++，inFlight，状态 saving
onArchive 成功且代号仍在 → done
抛错且代号仍在 → error，按钮恢复
title 或 tone 变化 → 代号增加，回到 idle
卸载 → 代号增加
```

文案：blocked 为「等待审核」；saving「正在归档」；error「归档失败，可重试」；done「已归档」；success 且 idle 为「任务成功」；其余「待处理」。按钮在 saving 时显示「归档中…」，done 时显示「已归档」，否则「归档当前项」。`aria-busy` 只在 saving。

`inFlight` 是同步 ref。`disabled` 要等渲染，挡不住同一次事件循环里的第二次点击。

play 使用 `@storybook/react-vite` 注入的 `canvas`，以及 `storybook/test` 的 `expect` 和 `fn`。不要从测试库再引一套同名 expect 进故事文件。

## 3. 三层

### 基本

故事 `Basic`。标题「普通资讯源」。play 看到标题、状态「待处理」、按钮可点，且 `onArchive` 未被调用。没有点击。

### 业务

故事 `Business`，`tone: 'success'`。先看到「任务成功」，再点击。状态变为「已归档」，按钮名变成「已归档」且禁用，`onArchive` 调用一次。

### 进阶

故事 `Advanced`，`tone: 'blocked'`。状态「等待审核」，按钮禁用，回调零次。这是交互约束，不是网络。

另有 `Recovery`，不在三个 demo id 里，但是同一文件，命令启动后会一起被发现。它先 `mockRejectedValueOnce(new Error('local fixture rejected'))`，点击后必须是「归档失败，可重试」且按钮仍叫「归档当前项」。再点一次成功，回调共两次。`mockReset` 放在 play 开头，避免故事之间留下上一次的实现。

## 4. 反例

### 反例 1：play 里不 await

```ts
play: async ({ canvas, userEvent }) => {
  userEvent.click(canvas.getByRole('button'))
  expect(canvas.getByRole('status')).toHaveTextContent('已归档')
}
```

点击和断言都要 await。否则故事在状态写上之前就结束。

### 反例 2：用 CSS 找字

```ts
canvas.getByText('归档')
```

「归档当前项」和「已归档」都会沾边。用 role 和完整名称，和组件里的按钮文案一致。

### 反例 3：失败却显示成功

```tsx
catch { setState('done') }
```

Recovery 要求错误文案，并且能再点。代际不对时不要把晚到的成功写上。

### 反例 4：故事共享一个 fn 却不复位

模块级 `recoveryArchive` 会留在热更新里。play 先 `mockReset` 再 `mockRejectedValueOnce`。Business 每次 args 自己 `fn()`，不要改成模块级还忘记复位。

### 反例 5：a11y: error 写成已经扫描

`preview.ts` 的注释写明：要接上会执行 addon 的测试命令，规则才会失败。配置本身不是 WCAG 报告，也不是读屏记录。

### 反例 6：在主站 Demo 里伪造 iframe

Lab 页不渲染故事。不要做一张假的控件面板代替 6029。源码查看器展示的是真实文件。

### 反例 7：staticDirs 指向产品 public

空数组是故意的。不要把用户上传目录或含令牌的静态文件挂进来。

### 反例 8：play 通过等于构建通过

`storybook dev` 和 `storybook build` 是两条命令。本页展示的是 dev。build 收据要另记。交互 PASS 也不能用「端口打开了」代替。

## 5. 组合

**F12**：`fn()` 的调用次数可以在 play 里断言。Vitest 文件不会自动跑这些故事，除非接上官方的 Vitest 插件。本配置没有接。

**F13**：跨页流程仍用 Playwright。不要把 play 的点击说成端到端。

**F17**：addon 背后可以是 axe。规则集、颜色对比和键盘顺序要单独看。三则主故事没有故意的缺陷；F17 那一页才有。

**MSW**：这张卡没有请求。不要为了故事去拦截生产 API。

## 6. 清单

- meta 用 `satisfies`，故事不另造 props。
- play 全部 await，定位用 role。
- blocked 不可点；成功路径只调用一次；失败可重试。
- title/tone 变化和卸载都会增加 generation。
- Recovery 每次 reset mock。
- a11y 设为 error 但没有执行记录就不说扫描过。
- 端口 6029，`--no-open`，config-dir 指向本目录。
- 不提交密钥，不加用户静态文件。

## 7. 升级

10.6.1 与仓库模板里的 Storybook 主版本一致。`@storybook/react-vite` 的 `canvas` 参数以 10 的 play 文档为准。不要写回 CSF2 的 `storiesOf`。

addon-a11y 的 `test: 'error'` 是 10.x 的参数。升级 minor 时核对它是否仍表示「有执行器时失败」。没有执行器的事实不变。

## 8. 验收

展示命令不等于 dev server 已监听。验收要分开：进程能起来、四则故事都被发现、Basic/Business/Advanced/Recovery 的 play 退出码、以及若声称 a11y 则另有一次真实规则运行。build 另计。没有收据就保持 NOT_RUN。不要用 SPA 的 6006 记录填写 F14。

## 9. 状态机细节

`StatusCard` 的四态是 idle、saving、done、error。blocked 不是第五个 state，它来自 prop `tone`。blocked 时 `archive` 在开头 return，按钮 disabled，文案「等待审核」。success 且 idle 显示「任务成功」，neutral 且 idle 显示「待处理」。

`aria-busy` 只在 saving。完成后按钮的可访问名称变成「已归档」，play 必须用这个新名称，不能再找「归档当前项」。失败后名称回到「归档当前项」，并且 `toBeEnabled`。

`title` 或 `tone` 变化会把进行中的保存作废：generation 增加，`inFlight` 清掉，状态回到 idle。Story 若在 play 中途改 args，晚到的 resolve 不能写成已归档。本页的四则 play 没有在中途改 args，但 effect 必须留着。

Recovery 的错误是 `Error('local fixture rejected')`。组件 catch 后不展示这段英文，只显示固定的「归档失败，可重试」。不要把异常 message 插进 DOM，避免以后把服务端字符串当成 HTML。

`fn()` 来自 `storybook/test`。Business 的 args 每次新建。Recovery 用模块级 `recoveryArchive`，所以 play 第一行 `mockReset`。热更新会保留模块状态，这不是可有可无的清理。

main.ts 的 stories glob 是 `../stories/**/*.stories.@(js|jsx|ts|tsx)`。config-dir 指向 `examples/.storybook`，所以 glob 相对那一层，能找到 `StatusCard.stories.tsx`。不要改成扫整个 Lab。

addon 列表只有 a11y。没有 essentials 的额外项写在文件里时，以这份 main 为准。`preview` 把 controls 展开。没有人点开 6029 之前，controls 面板不存在。

端口 6029 避开模板的 6006 和 6007。`--no-open` 避免命令抢浏览器。Lab 页面不监听这个端口。若你在终端真的启动了它，停掉进程才算清理，不要留在后台占着。

## 10. 故障对照

| 现象 | 先看 |
| --- | --- |
| play 先红后绿 | 漏了 await，断言跑在点击之前 |
| 找不到「归档当前项」 | 状态已经是 done，名称变成了「已归档」 |
| Recovery 第一次就成功 | mockReset 清掉了 rejectedOnce，或顺序反了 |
| 失败文案是 Error message | 组件把 message 渲染出来了。应使用固定句子 |
| a11y 面板是空的 | dev 没启动，或 addon 没进 main.ts。配置不等于已扫描 |
| 故事里出现别的组件 | glob 扫出了目录外的文件 |
| 用 6006 的结果填 F14 | 那是 SPA 模板，不是这份 config-dir |

构建命令本页没有展示。`storybook build` 若要作为 build 收据，要单独记录输出目录，并且不要把用户静态资源塞进 `staticDirs`。

## 11. 资料

- https://storybook.js.org/docs/writing-stories/play-function
- https://storybook.js.org/docs/get-started/frameworks/react-vite
- https://storybook.js.org/docs/api/main-config

命令里的端口是 6029。Lab 页面不监听它，也不渲染 `StatusCard`。play 的 await 和 a11y 的执行记录是两件不同的收据。
