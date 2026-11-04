# F18 rollup-plugin-visualizer — 工程手册

## 适用

对隔离 Vite 夹具写出 treemap、Markdown 或 raw-data。不分析主应用，不代替依赖规则或 Knip。

## 版本

`rollup-plugin-visualizer@7.1.1`，`vite@8.3.4`，MIT。`gzipSize: true`，`open: false`，`minify: 'oxc'`。

## 迁移

带走 `vite.config.ts`、`fixture/`、`report-policy.mjs`、`verify.mjs`。命令必须带本 config 和 `--mode`。清理只允许本条目 `reports/` 下的固定文件。

## 不可删的清理

构建前删除对应的报告和 `dist-<mode>`。不要把上一次的 JSON 留作本次证据。`heavy.ts` 保持动态 import。不打开浏览器，不写 sourcemap，不把含绝对路径的报告公开。

## 反例

- 不带 `--config` 去构建主应用。
- 用旧 reports 充数。
- 用一段假 HTML 通过策略测试就写 PASS。
- `open: true`。
- 把 gzip 估算当成线上瀑布。
- 公开 raw-data。
- 改成顶层 import 仍称懒加载。
- 用 F16 的零违规代替体积。

## 测试断言

- basic 像完整 HTML；business 有标题和表格；advanced 的 JSON 有 `version`。
- advanced 的 assets 里至少两个顶层 `.js`。
- 短于 100 字节的正文失败。
- `verify.mjs` 在构建失败时抛错，而不是读旧文件。
- 策略测试不启动 Vite。

## 真实限制

网页不跑构建。treemap 不是性能曲线。夹具只有 helper 和 heavy。主应用的 analyzer 输出不能填到这三个 mode。`open` 保持 false，避免构建时弹出浏览器。

## 证据

build 与 sdk 收据都要来自这条 config 的 Vite 进程，并写入 `docs/library-lab/evidence/runs/`。Actions 41779873259 的生产构建不是 F18。browser 保持 NOT_RUN。

`report-policy.test.mjs` 不启动 Vite。三个 mode 要各自的新产物。
