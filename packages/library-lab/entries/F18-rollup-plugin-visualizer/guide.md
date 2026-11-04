# rollup-plugin-visualizer 7.1.1｜独立 Vite 8 构建的三种报告

Lab 锁定 `rollup-plugin-visualizer@7.1.1` 和 `vite@8.3.4`（均为 MIT）。插件在 Rollup 结束时写出模块图。它不决定架构规则，也不发现未使用的 package.json 依赖。

执行种类是 `node-ci`。页面展示命令，不运行构建。`report-policy.test.mjs` 只检查字符串形状，不是一次 Vite 构建，也不是 SDK PASS。

没有 `docs/library-lab/evidence/runs/` 收据时 sdk、build、browser 保持 NOT_RUN。Actions 41779873259 的生产构建是 Library Lab 应用本身，不是 `examples/fixture` 这次隔离构建，不能当成 F18 的 PASS。

## Lab 当前示例

配置是 `examples/vite.config.ts`。`root` 是 `examples/fixture`。`mode` 只能是 basic、business、advanced。

| mode | 模板 | 产物 |
| --- | --- | --- |
| basic | `treemap` | `examples/reports/basic.html` |
| business | `markdown` | `examples/reports/business.md` |
| advanced | `raw-data` | `examples/reports/advanced.json` |

同时写出 `examples/reports/dist-<mode>/`。`emptyOutDir: true`，`sourcemap: false`，`minify: 'oxc'`，`open: false`。不要让插件自动打开浏览器。

页面命令：

```bash
pnpm exec vite build --config entries/F18-rollup-plugin-visualizer/examples/vite.config.ts --mode basic
```

business / advanced 只改 `--mode`。网页不执行。`verify.mjs` 会先删掉**这一条目**里固定的报告和 dist，再构建，再交给 `checkVisualizerReport`。它不会去清 Library Lab 的主 `dist/`。

夹具 `main.ts` 同步引用 `helper.ts`，点击后 `import('./heavy')`。advanced 要求 dist 的 assets 里至少两个顶层 `.js`，用来证明动态 import 被拆成 chunk。不要把旧的 `reports/` 留着冒充这次构建。

报告可能含绝对路径。不要把 HTML、Markdown 或 raw-data 提交到公开位置，也不要当生产体积的唯一档案。

## 1. 什么时候用

想知道一次真实打包里，模块落在哪个 chunk、gzip 数字从哪次构建来。源码层的禁止 import 用 F16。没人引用的文件用 F15。三者不要互相证明。

不要把 treemap 的面积当成加载时间。它没有网络瀑布。

## 2. 模型

`visualizer({ filename, template, gzipSize: true, open: false })`。gzip 数字来自这次插件，不是手写的。`checkVisualizerReport` 要求正文至少 100 字节。

basic：像 HTML 文档，有 html 标签。business：有一级标题和表格行。advanced：JSON 能解析，且 `version` 是字符串或数字；另外传入的资源名里要有至少两个顶层 js 文件。解析器不模拟插件。

`heavy.ts` 的 `fibonacci` 只在动态 import 之后执行。若有人改成顶层 import，chunk 断言会失败，这是故意的。

## 3. 三层

### 基本

treemap HTML。打开文件能看到模块块。页面本身不内嵌这份 HTML，避免把报告当成可执行页面。源码查看器若展示它，也是文本。

### 业务

Markdown 表。字节数必须来自同一次 `vite build`，不要从 basic 的 HTML 里抄一个数字写进文档。

### 进阶

raw-data JSON 给机器读。`verify.mjs` 只在这一层 `readdir` assets。少于两个 js 文件就失败。这证明拆包发生过，不证明每个路由都懒加载。

## 4. 反例

### 反例 1：分析主应用却说是本条目

```bash
pnpm exec vite build
```

不带本 config 会构建别的 root。命令必须带 `--config` 和 `--mode`。

### 反例 2：留下旧 reports

上次的 `advanced.json` 会让「文件存在」变成假象。`verify.mjs` 先 `rm` 固定路径。不要把删除范围扩大到其它条目。

### 反例 3：用策略测试代替构建

一段以 `<html>` 开头的字符串可以通过 basic 检查。没有 Vite 的退出码。sdk / build 收据必须是构建进程。

### 反例 4：open: true

插件打开浏览器会打扰本机，也把路径暴露到默认程序。配置保持 `open: false`。

### 反例 5：把 gzip 当成传输协议

`gzipSize: true` 是插件估算。服务器的 brotli、缓存和 HTTP 头不在这份报告里。不要用它当上线预算的唯一门禁，除非产品另行规定。

### 反例 6：公开带绝对路径的 JSON

raw-data 可能含本机目录。证据目录可以留私有日志。不要把用户项目的报告贴到公开频道。

### 反例 7：顶层 import 仍声称懒加载

```ts
import { fibonacci } from './heavy'
```

advanced 的两个 js 文件会消失或合并。保持动态 `import()`。

### 反例 8：用依赖图代替体积

F16 可以零违规，包仍然很大。F15 可以报告未使用文件，打包仍可能包含另一份拷贝。各看各的输出。

## 5. 组合

**F16**：先让 err 报告器约束 `fixture` 若把它放进更大的图。本夹具不跑 cruiser。体积不能反推规则。

**F15**：`helper.ts` 被静态引用，不应被当成未使用。`heavy.ts` 只在动态 import 中出现，Knip 的入口配置若漏掉它会误报。本页不跑 Knip。

**产品预算**：Lab 主应用的 analyzer 是另一条命令。不要把 `dist-basic` 的字节写进主应用预算。

## 6. 清单

- `--config` 指向本条目，`--mode` 三选一。
- `open: false`，不生成 sourcemap。
- 构建前删掉本条目固定的报告和 dist。
- basic HTML、business 表格、advanced JSON 加两个 js chunk。
- 不把旧文件当新结果。
- 不公开含绝对路径的报告。
- 页面不执行构建。
- 策略单测不写进 sdk PASS。

## 7. 升级

插件 7.1.1 的 `template: 'treemap' | 'markdown' | 'raw-data'` 和 Vite 8.3.4 的 `build.minify: 'oxc'` 是合同。升级插件后看 raw-data 的 `version` 字段还在不在；`checkVisualizerReport` 依赖它。升级 Vite 后确认动态 import 仍拆包。

不要为了对照 README 里另一套 Rollup 示例而换掉这份 Vite 配置。本仓库的入口就是 `vite.config.ts`。

## 8. 验收

页面三条命令可以人工跑。脚本是：

```bash
node packages/library-lab/entries/F18-rollup-plugin-visualizer/examples/verify.mjs
```

它要求三次构建都是新产物。日志里的字节数才是这次的。没有这份收据时，build 与 sdk 保持 NOT_RUN。browser 没有挂载 treemap，保持 NOT_RUN。不要把主应用的生产构建记到这个 mode 上。

## 9. 资料

- https://github.com/btd/rollup-plugin-visualizer
- https://www.npmjs.com/package/rollup-plugin-visualizer
- https://vite.dev/config/build-options
