# Storybook：独立组件状态与可执行交互

固定storybook、@storybook/react-vite、@storybook/addon-a11y均10.6.1 MIT。把组件的待处理、成功归档、禁用和失败恢复变成具名CSF3故事，适合组件开发评审；跨页登录用Playwright，纯业务逻辑用Vitest。本例是独立fixture，不占产品6006/6007，不把Storybook嵌进Lab主站。

## 三个实验目标

| 目标 | 对应故事与预期 |
| --- | --- |
| basic：状态合同 | Basic检查标题/待处理、按钮可用、回调0次 |
| business：真实交互 | Business的play点击后已归档，按钮禁用，回调1次 |
| advanced：受限与恢复 | Advanced按钮禁用且回调0次；Recovery首次拒绝显示错误并允许重试，第二次成功且回调2次 |

四则故事支撑三个任务，不按数量凑独立目标。onArchive是storybook/test的fn本地fixture，不是真实归档API。状态卡由真实React渲染，play用注入的canvas/userEvent和storybook/test expect，所有异步断言await。

## 完整迁入

复制examples/components/StatusCard.tsx、stories/StatusCard.stories.tsx、.storybook/main.ts和preview.ts，保留相对结构。React/ReactDOM19、TypeScript、Vite及以上三个固定Storybook包。main使用react-vite框架，stories相对main目录，staticDirs空；preview.controls展开，a11y.test='error'。tags autodocs是故事标签，本配置没有addon-docs，不承诺生成Docs页。

cwd=packages/library-lab（本仓库），实际命令：

```sh
pnpm exec storybook dev --no-open -p 6029 --config-dir entries/F14-storybook/examples/.storybook --disable-telemetry
pnpm exec storybook build --config-dir entries/F14-storybook/examples/.storybook --output-dir /tmp/reactloom-f14-storybook-review --disable-telemetry
```

Lab现有可复制dev配方使用6029；本次隔离验收实际运行的是build产物静态server6037。两者是不同进程/用途且可兼容，不把6037写成Lab复制命令的端口。

迁入独立项目时从项目root执行，将config-dir改为`examples/.storybook`。build输出只到拥有的空临时目录，不覆盖产品构建。dev仅启动不等于play/build已验；本次使用build产物静态server，未运行dev命令。Lab页只展示配方/源码，不启动CLI。

## 状态与生命周期

StatusCard archive同步先置inFlight，避免disabled渲染前双击进入；再saving。await回调成功→done、拒绝→error可重试。title/tone变化的effect递增generation、重置idle；卸载也递增，旧成功/错误/finally不能回写新一代。底层回调没有AbortSignal，只阻止过期状态提交，不物理取消服务或Promise。状态卡不用全局事件、定时器、URL或独立worker。

每story有独立fn。Recovery显式mockReset再配置rejectOnce，不把模块级mock历史带进重跑。本次同一iframe通过真实Storybook channel切Basic→Business→Advanced→Recovery→Business，五次play均success，重复Business回调1次断言仍通过；不是每次重载页逃避mock隔离。未执行held异步回调后args变更/卸载的运行验证，generation这部分为源码审计，不能把节点消失当destroy证明。

## build、play、a11y各自证明什么

独立CLI build已exit0，证明本配置/四story可打包，不能单独证明交互。浏览器真正打开静态iframe并等待官方storyFinished事件，断言status=success，证明四则play执行；Recovery的错误和重试断言包含其中。

实装addon-a11y10.6.1导出afterEach，在普通story结束也运行axe、reporting.addReport，不必先装test-runner才会扫描。`test:'error'`把违规报告标failed；standalone Vitest才额外用expect抛断言。普通Storybook build进程不会因未来浏览器规则违规自动exit1。因此validation/browser-check.mjs显式检查storyFinished里的a11y report存在、status passed、violations0，并把失败转成Node非零退出。不能把参数存在写成执行过。

本次Chromium实际四story（Business重复）报告axe-core4.14.0，各0 violations/0 incomplete。扫描范围为story内容，非整站WCAG、人工读屏、键盘顺序或视觉基线。未运行addon-vitest/test-runner集成，也没有把dev成功当测试器收据。

## 复现浏览器

独立build后，在拥有的空闲端口6037启动：

```sh
python3 -m http.server 6037 --bind 127.0.0.1 --directory /tmp/reactloom-f14-storybook-review
```

另终端repo root执行`node packages/library-lab/entries/F14-storybook/validation/browser-check.mjs`；脚本只用已安装Playwright启动headless Chromium，保存完整官方storyFinished/axe结果及简短日志。完成Ctrl-C停止自己的server，勿占4319/4320/4321。此处端口不占产品Storybook。迁入测试环境可换自己端口，保持脚本origin一致。

## 官方来源与限制

固定v10.6.1 commit a17b725f4069e0bda9dc87e3002063c726de8fbc，storybook包位于code/core；保存该包README原字节、根MIT LICENSE及三个包package.json。没有包中文README，英文快照不自行翻译。官方完整树与SHA在official。官网GET200未见阻止头，但无Lab-origin嵌入确认，unknown并保留直达。

正式verification没有recorder仍NOT_RUN。本地raw、CLI退出码、浏览器报告、配置strict检查在validation与local-validation。打包chunk-size warning保留，不将本教学静态站冒称生产性能通过。没有MSW、真实HTTP、付费服务、视觉快照或完整可访问性验收。
