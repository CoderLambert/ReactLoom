# 开发工具目录

这里只记仓库里真正有的生产力工具：它做什么、怎么用、配置文件在哪、三个模板有什么不同。标成「未实现」的项没有配置，不要到仓库里去找。

Turborepo 已接入，任务和缓存的说明在 [Turborepo](../turborepo.md)。工作流层面其余的比较（Chromatic、Lighthouse CI、Vercel、EAS 等）在 [工作流调研](workflow-research.md)。那些工具多数未实现。

三个模板都会收到本文。路径是各模板自己的文件名。monorepo 里它们在对应模板目录下；生成后的项目里它们在项目根目录。

## 总表

| 工具 | SPA | SSR | Expo |
| --- | --- | --- | --- |
| Biome | 已接入 | 已接入 | 已接入 |
| Lefthook 与 commitlint | 已接入 | 已接入 | 已接入 |
| VS Code 推荐与设置 | 已接入 | 已接入 | 已接入，无 Tailwind / Playwright |
| 点击跳到源码 | `code-inspector-plugin` | 同一插件，加 Next 自己的 overlay | `react-native-dev-inspector` |
| React Scan | 已接入，仅开发 | 已接入，仅客户端开发 | 未实现 |
| why-did-you-render | 未实现，用 React Scan | 未实现，用 React Scan | 已接入，仅开发 |
| 打包分析 | `rollup-plugin-visualizer` | `next analyze`，另留 webpack 分析器 | Expo Atlas |
| 属性差异 | React Scan，外加可选 hook | 同左 | why-did-you-render，外加可选 hook |
| Storybook | 已接入，端口 6006 | 已接入，端口 6007 | 未实现 |
| MSW 开发态模拟 | `VITE_ENABLE_MSW`，默认开 | `NEXT_PUBLIC_ENABLE_MSW`，默认关 | 未实现。用 `EXPO_PUBLIC_USE_FIXTURES` |
| axe | 开发态 `@axe-core/react`，e2e 用 Playwright | 同左 | 未实现。Web 预览用浏览器扩展 |
| 端到端 | Playwright | Playwright | Maestro，不在 CI 里跑 |
| vite-plugin-checker | 已接入 | 未实现。用 Next 的 overlay | 未实现 |
| TanStack 开发工具 | Query 和 Router | 只有 Query | 未实现 |
| Vitest UI 与覆盖率 | 已接入 | 已接入 | 已接入 |
| Turborepo | 已接入 | 已接入 | 已接入 |

## Turborepo

### 作用

Turborepo 2.11.7 编排工作区里的 `build`、`dev`、`test`、`lint`、`typecheck`、`analyze`、`storybook`。它缓存 `dist`、`.next`（不含 `.next/cache`）、`storybook-static` 和 `coverage`。它不代替 Vite、Next.js 或 Expo。

### 用法

仓库根的 `pnpm dev:spa`、`pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build` 都是 `turbo run`。某个模板目录里的 `pnpm dev` / `pnpm build` 仍是该包自己的命令。

### 配置

根 `turbo.json`。三个模板经 `template.json` 的 `configs` 复制这一份，并带上 `turbo` 开发依赖。生成后的 `pnpm-workspace.yaml` 含 `"."` 和 `packages/*`，所以应用和共享包都会被调度。字段、命令、清缓存和可选的远程缓存见 [Turborepo](../turborepo.md)。

### 模板差异

任务名相同。SPA 和 SSR 有 `storybook` 与 `test:e2e`。Expo 没有这两条脚本，Turbo 会跳过。`dev` 在 Expo 上是 `expo start`。

## Biome

### 作用

格式化和静态检查都由 Biome 2.5.15 做。不用 ESLint，也不用 Prettier。TypeScript 7 没有给 `typescript-eslint` 用的稳定编译器 API，所以类型检查留给 `tsc`，不放进 Biome。

### 用法

| 命令 | 在哪跑 | 做什么 |
| --- | --- | --- |
| `pnpm lint` | 仓库根 | `turbo run lint lint:root`。各包的 `lint` 是 `biome check .` |
| `pnpm format` | 仓库根 | `biome check --write .` |
| `pnpm lint` | 某个模板目录 | 只检查那个包 |

编辑器里保存时也会格式化，见下一节的 VS Code 设置。提交时 Lefthook 只对暂存文件跑 `biome check --write`。

### 配置

`biome.json`（版本模式 `2.5.15`）。三个模板通过 `template.json` 的 `configs` 复制这一份，不各写一份。

和日常有关的设置：

- 缩进 2 个空格，行宽 100。
- 忽略 `node_modules`、`dist`、`.next`、`.expo`、`coverage`、`playwright-report`、`test-results`、`pnpm-lock.yaml`、`mockServiceWorker.js`、`storybook-static`、`next-env.d.ts`。
- 推荐规则，外加 a11y 推荐规则，以及 `noExplicitAny` 为 error。
- VCS 使用 git 的忽略文件。

### 模板差异

没有。SPA、SSR、Expo 用同一份 `biome.json` 和同一条 `pnpm lint`。

## Lefthook 与 commitlint

### 作用

Lefthook 2.2.1 跑 git 钩子。commitlint 21.2.3 检查提交说明是不是约定式提交。Husky 和 lint-staged 未实现。

非零退出会挡住这次提交。钩子不快跑全仓库：格式化只看暂存文件。类型检查和测试用 `turbo --affected`，范围是相对 `main` 有变化的包。

### 用法

安装依赖之后钩子就会注册，因为 `pnpm-workspace.yaml` 的 `onlyBuiltDependencies` 里有 `lefthook`。pnpm 10 默认不跑依赖的安装脚本，漏了这一项就没有钩子。

不需要单独的命令。`git commit` 时：

1. pre-commit：Biome，然后 `pnpm exec turbo run typecheck test --affected`。
2. commit-msg：`pnpm exec commitlint --edit`。

说明形如 `docs: add a tool catalog`。绕过钩子的 `--no-verify` 不是工作流的一部分。

### 配置

| 文件 | 作用 |
| --- | --- |
| `lefthook.yml` | pre-commit 与 commit-msg。`parallel: false` |
| `commitlint.config.mjs` | `extends: ['@commitlint/config-conventional']` |
| `pnpm-workspace.yaml` | `onlyBuiltDependencies: [lefthook]` |
| 根 `package.json` | `typecheck:affected`、`test:affected` 是 `turbo run … --affected`。模板包里的同名脚本仍是 `pnpm --filter "...[HEAD]"` |

pre-commit 的 Biome glob 是 `*.{js,jsx,ts,tsx,json,css,mjs,cjs}`，带 `stage_fixed: true`，格式化结果会回到暂存区。affected 那一步的 glob 是 `*.{ts,tsx}`。只改了 Markdown 时，不会因此跑类型检查。`--affected` 比包脚本里的 `...[HEAD]` 宽，功能分支会带上自 `main` 以来的改动。

### 模板差异

没有单独的钩子文件。三个模板都复制根上的 `lefthook.yml` 和 `commitlint.config.mjs`。

## VS Code 扩展与设置

### 作用

推荐扩展，并把保存时的格式化指到 Biome。Cursor 读同一份 `.vscode`。这些文件不会自动安装扩展，只是打开文件夹时编辑器会提示。

### 用法

用 VS Code 或 Cursor 打开仓库根（或生成后的项目根）。接受工作区推荐。保存文件时应看到 Biome 在格式化。

不要安装被标成 unwanted 的 ESLint 和 Prettier 扩展，它们会和 Biome 抢格式化。

### 配置

monorepo 根 `.vscode/extensions.json` 推荐：

| 扩展 id | 用途 |
| --- | --- |
| `biomejs.biome` | 格式化与检查 |
| `bradlc.vscode-tailwindcss` | Tailwind 类名 |
| `vitest.explorer` | 测试树 |
| `ms-playwright.playwright` | 端到端 |
| `expo.vscode-expo-tools` | Expo |
| `usernamehw.errorlens` | 把诊断显示在行尾 |

`unwantedRecommendations`：`dbaeumer.vscode-eslint`、`esbenp.prettier-vscode`。

根 `.vscode/settings.json`：

- `editor.formatOnSave` 为 true，`editor.defaultFormatter` 为 `biomejs.biome`。
- 保存时的 code action：`source.fixAll.biome` 和 `source.organizeImports.biome`，都是 `explicit`。
- `typescript.tsdk` 指向 `node_modules/typescript/lib`，并提示使用工作区 TypeScript。
- `tailwindCSS.classFunctions` 包含 `cn` 和 `cva`，另外有一组 `experimental.classRegex`，让智能提示能看见这两个函数里的类名。

根上的 `.vscode` 不在 `template.json` 的 `configs` 里。生成项目拿到的是模板目录里的那一份。

### 模板差异

| | SPA `.vscode` | SSR `.vscode` | Expo `.vscode` |
| --- | --- | --- | --- |
| Biome、Vitest、Error Lens | 有 | 有 | 有 |
| Tailwind | 有 | 有 | 无 |
| Playwright | 有 | 有 | 无 |
| Expo Tools | 无 | 无 | 有 |
| `settings.json` 里的 Tailwind 正则 | 有 | 有 | 无。只保留 Biome 和 `typescript.tsdk` |

## 点击跳到源码

### 作用

开发服务器开着的时候，用快捷键点页面上的元素，编辑器打开对应文件和行。保存后由各自的热更新接手：Vite HMR、Next Fast Refresh、Expo Fast Refresh。生产构建不包含这套检查器。

检测编辑器的程序是 `scripts/open-in-editor.mjs`。检查器实际启动的是 `scripts/code`（Windows 是 `scripts/code.cmd`）。这个名字叫 `code`，这样检查器会把 `file:line` 传进来。它不是 VS Code。不要把 `scripts/` 加进 `PATH`，否则系统会找到这个垫片而不是编辑器。

`.env.development` 把开发工具打开，并且故意不设置编辑器，好让下面的检测顺序生效。机器自己的选择写在 `.env.local` 的 `LAUNCH_EDITOR`。

### 用法

| 模板 | 手势 |
| --- | --- |
| SPA、SSR | macOS 按住 Option+Shift，Windows 和 Linux 按住 Alt+Shift，再点击元素 |
| Expo | 点闪电按钮，再点组件。先 `pnpm dev`，需要 Web 预览时在终端按 `w`。生成项目不会替你启动模拟器 |

Neovim 要先有一个正在听的服务器。开发服务器不能自己弹出一个新的 nvim 窗口。一次性步骤，在项目目录：

```sh
nvim --listen .nvim.sock
```

或者在 `init.lua` 里，只在套接字还不存在时启动：

```lua
local sock = vim.fn.getcwd() .. "/.nvim.sock"
local uv = vim.uv or vim.loop
if uv.fs_stat(sock) == nil then
  pcall(vim.fn.serverstart, sock)
end
```

`$NVIM` 只在 Neovim 的内置终端里才有。`.nvim.sock` 已被 gitignore。套接字文件还在、但是没有进程在听时，删掉再开：`rm -f .nvim.sock`。

检测顺序写在 `scripts/open-in-editor.mjs` 的 `planLaunch`：

1. 显式命令，按这个顺序看环境变量：`REACTLOOM_EDITOR`、`LAUNCH_EDITOR`、`CODE_EDITOR`、`REACT_EDITOR`、`VISUAL`、`EDITOR`。值如果就是启动器自己，会跳过，避免递归。值如果是 `nvim`，走 Neovim 的路径（已有服务器，否则再尝试新终端）。
2. 正在听的 Neovim：`$NVIM`，然后 `$NVIM_LISTEN_ADDRESS`，然后从当前目录向上到 git 根查找 `.nvim.sock`。命令是 `nvim --server <address> --remote +<line> <file>`。
3. 正在运行的图形编辑器，按这个顺序找进程：Cursor、VS Code、Code Insiders、VSCodium。参数是 `-r -g file:line:column`。
4. 新的终端 nvim：macOS 用 Terminal.app（`osascript`），Windows 用 `wt`，Linux 用 `$TERMINAL` 或 kitty、alacritty、wezterm、gnome-terminal、konsole、xfce4-terminal、xterm。开发服务器没有 TTY，所以不会把 nvim 绑到自己的标准输入上。

都失败时，终端里会打印 `failureReason()` 的那几行，其中包括 `nvim --listen .nvim.sock`。

### 配置

| 文件 | 作用 |
| --- | --- |
| `scripts/open-in-editor.mjs` | 检测和打开 |
| `scripts/code`、`scripts/code.cmd` | 检查器调用的垫片 |
| `.env.development` | 开发工具开，编辑器不设 |

这三个文件通过 `template.json` 的 `configs` 进生成项目。`clickToSource.launcher` 是 `scripts/open-in-editor.mjs`。

### 模板差异

| | SPA | SSR | Expo |
| --- | --- | --- | --- |
| 包 | `code-inspector-plugin` 2.0.9 | 同左 | `react-native-dev-inspector` 1.1.0 |
| 接在哪 | `vite.config.ts`，只在开发服务器，且 `VITE_DEVTOOLS` 不是 `false` | `next.config.ts`。生产构建以及 `NEXT_PUBLIC_DEVTOOLS=false` 时插件的 `dev` 为 false | `metro.config.js` 把 launcher 交给 inspector；`babel.config.js` 在非生产时加插件；`src/lib/dev-inspector.tsx` 包住界面 |
| 环境 | `.env.development` 里 `VITE_DEVTOOLS=true` | `NEXT_PUBLIC_DEVTOOLS=true` | `EXPO_PUBLIC_DEVTOOLS=true` |
| 另外的报错界面 | Vite overlay 保持打开。`vite-plugin-checker` 在浏览器里显示 TypeScript | Next 自己的 overlay。不要再加 checker | LogBox，由 `expo-router/entry` 调用 `setupLogBox()`。`app/_layout.tsx` 导出的错误边界在开发时显示符号化后的栈 |
| 生产 | `vite build` 不激活 launcher，产物里没有 `data-insp-path` | 生产构建不激活 | 导出不包含这套开发插件 |

SSR 的服务器组件在开发时也会带上 `data-insp-path`。错误边界里的帧如果用 JSX 写 `data-insp-path`，会被检查器的编译改写，所以那些按钮用 `createElement`。这是实现细节，使用时仍然是点那一行。

## React Scan

### 作用

在开发时把指针悬在元素上，看 React 组件名、props 和渲染时间，并高亮重新渲染。轮廓里也会列出变了的 props。版本是 `react-scan` 0.5.7。不使用 CDN，也不使用 `react-scan/all-environments`，那两种会在开发之外运行。

### 用法

`pnpm dev` 之后直接悬停。不需要再打开开关，只要对应的 `*_DEVTOOLS` 不是 `false`。

生产构建把 `react-scan` 指到一个空模块，包里不应出现这个库（实现上会看到 `bippy` 这个内部名）。Playwright 把开发工具环境变量设为 `false`，所以端到端页面上没有这层面板。

### 配置

| | SPA | SSR |
| --- | --- | --- |
| 入口 | `src/main.tsx`。`react-scan` 的 import 必须在 React 和 React DOM 之前。`scan({ enabled: true })` 在 `import.meta.env.DEV` 且 `VITE_DEVTOOLS === 'true'` 时调用 | `src/app/react-scan.tsx` 是客户端组件，import 在 `react` 之前，`useEffect` 里 `scan({ enabled: true })`。`src/app/layout.tsx` 把它作为最上面的 import 并渲染 `<ReactScan />` |
| 生产桩 | `src/lib/devtools-stub.ts` 导出空的 `scan`。`vite.config.ts` 在生产和 `VITE_DEVTOOLS=false` 时把 `react-scan` 指到它 | `src/lib/react-scan-stub.ts`。`next.config.ts` 用 Turbopack 的 `resolveAlias`，以及 `next build --webpack` 用的 webpack alias |
| 清单 | `template.json` 的 `reactScan.enabled` 为 true | 同左 |

### 模板差异

Expo 未实现。`template.json` 里 `reactScan.enabled` 是 false。原因是这一句，写在 Expo 的 `AGENTS.md` 里：react-scan 0.5.7 没有 React Native 导出，原生预览还没合并，所以这个模板不加载 React Scan。悬停轮廓只存在于 SPA 和 SSR。

## why-did-you-render

### 作用

在控制台记录不必要的重新渲染以及原因。纯组件会打印变了的 props。版本 `@welldone-software/why-did-you-render` 10.0.1 要求自动 JSX 运行时把它自己当作 `jsxImportSource`，并且它会改 React 的运行时，所以不能进生产包。

### 用法

只在 Expo 的 `pnpm dev` 里看终端。没有快捷键。给一个没有 `memo` 的组件看差异时，在组件上设 `whyDidYouRender = true`。

SPA 和 SSR 不要装它。替代是上一节的 React Scan 轮廓。还要看某一个组件的控制台差异时，用后面的 `useWhyDidYouUpdate`，不要从入口文件 import 这个 hook。

### 配置

Expo：

| 文件 | 作用 |
| --- | --- |
| `index.js` | 第一行 import `./src/lib/wdyr`，然后才是 `expo-router/entry` |
| `src/lib/wdyr.js` | 在 `__DEV__` 且 `EXPO_PUBLIC_DEVTOOLS !== 'false'` 时 `whyDidYouRender(React, { trackAllPureComponents: true })` |
| `babel.config.js` | 非生产、并且 Metro 不是在做导出编译时，才把 `jsxImportSource` 设成这个包 |
| `src/wdyr.d.ts` | 该包的类型引用 |

`template.json` 的 `whyDidYouRender.enabled` 只在 Expo 为 true。

### 模板差异

| | SPA | SSR | Expo |
| --- | --- | --- | --- |
| 状态 | 未实现 | 未实现 | 已接入 |
| 原因 | Vite 8 会把 JSX import 插到 React Scan 前面，而 React Scan 必须是第一个 import | Next.js 16 用 SWC 编译 JSX，没有应用级的 `jsxImportSource`。加 Babel 会和 Turbopack 对着干 | `babel-preset-expo` 接受 `jsxImportSource`，并且可以限制在开发 |

这两句原因在 SPA 和 SSR 的 `AGENTS.md` 里，也是 `template.json` 的 `whyDidYouRender.reason`。

## 打包分析

### 作用

看生产 JS 的组成。`pnpm build` 不跑分析器。`pnpm analyze` 才跑。分析报告不提交。

### 用法

在对应模板目录执行 `pnpm analyze`。看完报告再决定要不要改 import。体积闸门是另一条路径，见 [工作流调研](workflow-research.md) 的预算一节：SPA 和 SSR 的 `pnpm build` 会跑 `scripts/check-bundle-budget.mjs`。

### 配置与模板差异

| | SPA | SSR | Expo |
| --- | --- | --- | --- |
| 状态 | 已接入 | 已接入 | 已接入 |
| 包 | `rollup-plugin-visualizer` 7.1.1 | `@next/bundle-analyzer` 16.4.0，加上 Next 自带的分析器 | `expo-atlas` 0.4.3 |
| 脚本 | `ANALYZE=true vite build` | `next analyze --output` | `EXPO_ATLAS=true expo export --platform web --output-dir dist && expo-atlas .expo/atlas.jsonl` |
| 报告 | `dist/stats.html` | `.next/diagnostics/analyze` | `.expo/atlas.jsonl`，然后 Atlas 的界面 |
| 配置位置 | `vite.config.ts`。只在 `ANALYZE` 为真时加入 visualizer，`gzipSize: true`，`open: false` | `next.config.ts`。`pnpm analyze` 走 Turbopack 的 `next analyze`。`ANALYZE=true next build --webpack` 仍会写出 `.next/analyze` | `package.json` 的 `analyze` 脚本 |
| 清单 | `template.json` 的 `bundleAnalyze` | 同左 | 同左 |

`@next/bundle-analyzer` 不支持 Turbopack，而 Next.js 16 的默认构建是 Turbopack，所以默认命令是 `next analyze`，webpack 分析器留着给显式的 webpack 构建。

Expo 没有 gzip 预算脚本。Atlas 文件在被 gitignore 的 `.expo` 里，里面有源码映射，不要提交。

## 属性差异

### 作用

回答「这次渲染，哪个 prop 变了」。不另做一层遮罩。

### 用法

| 模板 | 先看什么 | 只盯一个组件时 |
| --- | --- | --- |
| SPA、SSR | React Scan 的轮廓：变了的 props、渲染时间、重新渲染的高亮 | 在该组件里调用 `useWhyDidYouUpdate` |
| Expo | why-did-you-render 打印上一次 props、这一次 props 和原因。纯组件默认就会打；其它组件要 `whyDidYouRender = true` | 同一个 hook |

```tsx
import { useWhyDidYouUpdate } from '@reactloom/devtools'

useWhyDidYouUpdate('TaskRow', { task, status })
```

开发时控制台出现 `[why-did-you-update] TaskRow` 和浅比较的差异（`Object.is`）。生产构建里 `NODE_ENV` 会把日志去掉。没有任何文件 import 它时，它不在包里。

不要在应用入口或根组件上调用。错误边界用的是 `@reactloom/devtools/stack` 的 `parseDevStack`，那个子路径导出不会把这个 hook 带进生产包。

### 配置

| 文件 | 作用 |
| --- | --- |
| `packages/devtools/src/use-why-did-you-update.ts` | `useWhyDidYouUpdate` 和 `diffProps` |
| `packages/devtools/src/index.ts` | 从包入口再导出 |
| 各模板 `template.json` 的 `propsDiff` | 写明主工具是 `react-scan` 或 why-did-you-render，hook 来自 `@reactloom/devtools` |
| `packages.devtools` | 为 true 时，生成项目会复制这个包 |

三个模板都复制 devtools。差异只是「日常看的那一层」：Web 是 React Scan，Expo 是 why-did-you-render。

## Storybook

### 作用

不为整页准备数据，单独看一个组件。SPA 和 SSR 的 story 覆盖 Button、Input、Label、Card，以及登录画面。预览会启动该模板自己的 MSW handlers。

### 用法

| 命令 | SPA | SSR |
| --- | --- | --- |
| `pnpm storybook` | 端口 6006，不自动打开浏览器 | 端口 6007 |
| `pnpm build-storybook` | 静态产物 | 同左 |

两条命令都设置 `STORYBOOK=true`。这个变量让生产用的 MSW 和 axe 空别名不要生效，否则 story 构建会去请求一个不存在的桩路径。

Chromatic 未实现。没有视觉回归服务。

### 配置

| 文件 | 作用 |
| --- | --- |
| `.storybook/main.ts` | `stories` 为 `../src/**/*.stories.tsx`，插件是 `@storybook/addon-a11y` 和 `msw-storybook-addon` |
| `.storybook/preview.ts` | `mswLoader`（从 `msw-storybook-addon/csf3`），`setupWorker`，`onUnhandledFrame: 'bypass'`，`parameters.msw.handlers`，`parameters.a11y.test` 为 `todo` |
| `src/**/*.stories.tsx` | 和组件放在一起 |

SPA 的 framework 是 `@storybook/react-vite`。SSR 的 framework 是 `@storybook/nextjs`。版本都是 Storybook 10.6.1。`template.json` 的 `storybook` 记录这些字段，生成时会检查。

### 模板差异

Expo 未实现。不要安装 `@storybook/react-native`。SDK 57 与该包要求的 safe-area-context 和 bottom-sheet 对不上，原因写在 Expo 的 `AGENTS.md`。本地数据继续走 `EXPO_PUBLIC_USE_FIXTURES`。

## MSW 开发态模拟

### 作用

浏览器里用和测试相同的 handlers 返回假数据，这样没有后端也能点登录和任务。MSW 3.0.3。只在开发服务器里启动 worker。生产构建把 MSW 的子路径指到空桩。

### 用法

SPA：`pnpm dev` 时默认就开。账户 `ada@reactloom.dev` / `loom-demo`。要关掉时把 `VITE_ENABLE_MSW` 设为 `false`。

SSR：默认关，这样 Playwright 打到的是真正的 route handler。要在浏览器里用假数据，把 `NEXT_PUBLIC_ENABLE_MSW=true` 写进 `.env.local` 再 `pnpm dev`。不要在端到端里打开它。

Expo：没有 MSW。`EXPO_PUBLIC_USE_FIXTURES` 默认 `true`，登录和任务走本地夹具。设为 `false` 才调用 `@reactloom/api-client`。

### 配置

| | SPA | SSR | Expo |
| --- | --- | --- | --- |
| 状态 | 已接入 | 已接入，默认关 | 未实现 MSW。夹具已接入 |
| 开关 | `VITE_ENABLE_MSW`，schema 默认 `true`（`src/lib/env.ts`） | `NEXT_PUBLIC_ENABLE_MSW`，默认 `false`（`src/server/env.ts`） | `EXPO_PUBLIC_USE_FIXTURES`，默认 `true`（`src/lib/env.ts`） |
| 启动 | `src/main.tsx` 在 DEV 且开关为真时 `worker.start`，worker 文件是 `/mockServiceWorker.js` | `src/app/dev-client.tsx` 只在开关为 `'true'` 时启动 | `src/features/auth/service.ts` 在夹具模式下不发请求 |
| handlers | `src/mocks/handlers.ts` | 同左 | 无 |
| 测试 | Vitest 用 `src/mocks/server.ts`。`vitest.config.ts` 把 `VITE_ENABLE_MSW` 设为 `false`，测试服务器自己听 | 路由测试直接打 handler，不靠浏览器 worker | 仓库测试，不靠 MSW |
| 生产别名 | `vite.config.ts` 把 `msw/browser`、`msw/http`、`msw/node` 指到 `src/lib/workflow-stub.ts` | `next.config.ts` 同样三个子路径 | 依赖里没有 `msw` |
| 清单 | `template.json` 的 `browserMocks` | 同左 | `browserMocks` 的模式是 fixtures |

不要加一个裸的 `msw` 别名。它会按前缀匹配到 `msw/browser`，把请求指到 `workflow-stub.ts/browser` 这种不存在的路径。`STORYBOOK=true` 时这些别名关掉。

SPA 的 `package.json` 里 `msw.workerDirectory` 是 `["public"]`。

## axe

### 作用

开发时在控制台报告可访问性违规。端到端用 `@axe-core/playwright` 扫整页。这不是 Lighthouse。

### 用法

SPA 和 SSR：`pnpm dev` 且开发工具开着时，控制台会出现 `@axe-core/react` 的结果。另外安装浏览器扩展 axe DevTools，做一次手动检查。扩展不是仓库能安装的。

`pnpm test:e2e` 跑 `e2e/workshop.spec.ts`。规格从 `@axe-core/playwright` 引入 `AxeBuilder`。Playwright 把 `VITE_DEVTOOLS` 或 `NEXT_PUBLIC_DEVTOOLS` 设为 `false`，所以端到端页面不会再加载 `@axe-core/react`。两套不要叠在同一次扫描里。

Expo：未实现 `@axe-core/react`，它需要 DOM。Web 预览用 axe DevTools 扩展。设备流程用 Maestro，见下一节。

### 配置

| | SPA | SSR | Expo |
| --- | --- | --- | --- |
| 开发态包 | `@axe-core/react` 4.13.0 | 同左 | 未实现 |
| 启动位置 | `src/main.tsx`，动态 import，间隔 1000 ms | `src/app/dev-client.tsx` | 无 |
| 端到端 | `e2e/workshop.spec.ts` | 同左 | 无 |
| 单元测试里的 axe-core | `src/features/auth/login-page.test.tsx` 直接用 `axe-core` | 无这份页面测试 | 无 |
| Storybook | `.storybook/preview.ts` 的 a11y 插件，`test: 'todo'` | 同左 | 无 |
| 生产 | 别名到 `src/lib/workflow-stub.ts` 的 `@axe-core/react` | 同左 | 包不在依赖里 |
| 清单 | `template.json` 的 `devA11y.enabled` 为 true | 同左 | false，`reason` 说明需要 DOM |

## Playwright 与 Maestro

### 作用

Web 上跑真实浏览器里的工作流，并用 axe 扫。Expo 上用 Maestro 描述一次点击登录，但是 CI 不启动模拟器，所以那条流程不是闸门。

### 用法

第一次要装浏览器。在 SPA 或 SSR 目录，或在仓库根：

```sh
pnpm test:e2e:setup
```

Linux 上系统库一起装（pnpm 10 不要在参数前加额外的 `--`）：

```sh
pnpm test:e2e:setup --with-deps
```

然后 `pnpm test:e2e`。仓库根的这条命令只过滤 SPA 和 SSR。

本地已经开着开发服务器时，Playwright 会复用它（`reuseExistingServer` 在非 CI 时为真）。CI 里每次自己起 `pnpm dev`，重试 2 次，`trace: 'on-first-retry'`。

Expo 没有 `test:e2e` 脚本。设备流程是手工或本机 Maestro：`.maestro/login.yaml`。CI 不跑它，Maestro 也不是 npm 依赖。

### 配置

| | SPA | SSR | Expo |
| --- | --- | --- | --- |
| 工具 | `@playwright/test` 1.64.0 | 同左 | Maestro。未接入 CI |
| 配置 | `playwright.config.ts` | 同左 | `.maestro/login.yaml` |
| 规格 | `e2e/workshop.spec.ts` | 同左 | 无 |
| baseURL | `http://127.0.0.1:4317` | `http://127.0.0.1:4318` | `appId: com.reactloom.app` |
| webServer 环境 | `VITE_ENABLE_MSW=true`，`VITE_API_BASE_URL` 指向 4317，`VITE_DEVTOOLS=false`，`REACTLOOM_OPEN=false` | `NEXT_PUBLIC_DEVTOOLS=false`，`REACTLOOM_OPEN=false`。不设置 `NEXT_PUBLIC_ENABLE_MSW`，因此保持默认 false | 无 |
| 项目 | 只有 Desktop Chrome | 同左 | 无 |
| CI | 模板工作流和 monorepo 的 `verify (spa)` | `verify (ssr)`。模板工作流的缓存键带 `playwright-ssr-` 前缀 | `verify (mobile)` 只到 `pnpm build` |
| 清单 | `template.json` 的 `e2e.tool` 为 `playwright` | 同左 | `maestro` |

`REACTLOOM_OPEN=false` 避免测试时弹出浏览器窗口。SPA 的 `server.open` 和 SSR 的 `scripts/open-browser.mjs` 都会看这个变量。

## vite-plugin-checker

### 作用

SPA 的开发服务器在浏览器里显示 TypeScript 错误，同时 Vite 自己的 overlay 仍然开着。检查器去调 `tsc`，不跑 ESLint 或 Biome。

### 用法

SPA 的 `pnpm dev`。类型错误出现在页面遮罩和终端。`enableBuild` 是 false，所以 `vite build` 不靠这个插件做类型检查。类型检查是单独的 `pnpm typecheck`。

### 配置

`vite.config.ts` 里的 `checker({ typescript: true, enableBuild: false })`。版本 `vite-plugin-checker` 0.14.5。

### 模板差异

| SPA | SSR | Expo |
| --- | --- | --- |
| 已接入 | 未实现。Next.js 有自己的编译 overlay，不再加这个插件 | 未实现。错误在 Metro 终端和 LogBox |

## TanStack 开发工具

### 作用

在页面上查看 Query 缓存，SPA 还可以查看 Router 的匹配。只在开发、并且开发工具开关打开时加载，用 `lazy` 拆出去。

### 用法

`pnpm dev`。面板默认收起。SPA 上 Query 的按钮在左下（`buttonPosition="bottom-left"`），Router 的开发工具在 `src/main.tsx` 里按同一条件加载。SSR 只有 Query，按钮同样在左下。

Playwright 把开发工具关掉，面板不会挡 axe。

### 配置

| | SPA | SSR |
| --- | --- | --- |
| Query | `src/app/providers.tsx`，条件是 `import.meta.env.DEV && VITE_DEVTOOLS === 'true'` | `src/app/providers.tsx`，条件是 `NODE_ENV === 'development'` 且 `NEXT_PUBLIC_DEVTOOLS !== 'false'` |
| Router | `src/main.tsx` | 无。SSR 不用 TanStack Router |
| 生产 | `vite.config.ts` 把 `@tanstack/react-query-devtools` 和 `@tanstack/react-router-devtools` 指到 `src/lib/devtools-stub.ts` | Query 开发工具只在开发条件里 dynamic import，生产构建不应把它打进客户端 |

### 模板差异

Expo 未实现。`app/_layout.tsx` 有 `QueryClientProvider`，没有开发工具面板。

## Vitest UI 与覆盖率

### 作用

本地看测试界面，或生成 v8 覆盖率。二者都不是 CI 闸门。CI 跑的是 `pnpm test`（`vitest run`）。

### 用法

在某个包或模板目录：

```sh
pnpm test:ui
pnpm test:coverage
```

仓库根的 `pnpm test:coverage` 是 `turbo run test:coverage`。没有这个脚本的包会被跳过。覆盖率目录是该任务的输出。

### 配置

各模板和共享包的 `package.json` 脚本，加上它们自己的 `vitest.config.ts`。覆盖率依赖是 `@vitest/coverage-v8`。UI 依赖是 `@vitest/ui`。Vitest 版本是 5.0.3。

### 模板差异

三个模板都有 `test`、`test:ui`、`test:coverage`。SPA 的 Vitest 会把 `VITE_ENABLE_MSW` 设为 `false`，因为节点测试用的是 `src/mocks/server.ts`，不是浏览器 worker。Expo 的测试是仓库和 reducer，没有浏览器。

## 生成项目会拿到什么

每份 `template.json` 的 `docs` 包含本文和 [工作流调研](workflow-research.md)。生成时这两份不按模板删节，因为它们本来就是三份模板的对照。

工具本身按清单字段复制或跳过：`clickToSource`、`reactScan`、`whyDidYouRender`、`bundleAnalyze`、`propsDiff`、`storybook`、`browserMocks`、`devA11y`、`e2e`。Expo 上标成未实现的那些，生成后的 `package.json` 里不会出现对应依赖。
