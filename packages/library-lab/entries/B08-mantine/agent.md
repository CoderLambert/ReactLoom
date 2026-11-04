# B08 Mantine — Agent 移植手册

## 选型条件

适合统一 Mantine UI 体系的 React19 项目；基线 `@mantine/core@9.7.3`、`@mantine/hooks@9.7.3`。已有 MUI/Ant Design 时不要仅为单控件混用多个大设计系统。二者 CSS/Portal 体系不同。

## 实际可复用文件

`examples/example.tsx` 是真实 demo；`examples/demo.tsx` 只是出口。可迁移的是 Provider/Theme 初始化、各业务组件状态、NumberInput union 校验和受控 Modal；Lab 内模拟的 RSS 记录不是正式数据源。导入 `styles.layer.css` 与 `styles.css` 只选一套，`MantineProvider` 生产放真正根节点，别复制到每条列表。

## 必须保留

- NumberInput `number|string` 中间态；不要把空、短横线、无效超界数字直接转成业务数值。
- 类型和区间校验通过后更新状态，后端再次校验 409/422。
- 以稳定业务 ID 更新 Table 行；保留语义表头和状态文字。
- Modal 的键盘焦点、Portal/CSS token 作用域与 Tab 卸载清理。
- 外部源字符串不能注入 CSS、HTML 或任意 JS，样式变量来自可信配置。

## 建议测试

真实SDK渲染 TextInput、Badge、Table、Switch、NumberInput、Modal；中文 IME；输入空字符串、负号、边界1/100/101、大整数；更改/撤销准确恢复；Dialog关闭后焦点返回；一个 Lab Tab 卸载后无残存 Portal。测试的 API/锁文件版本需与 verification.json 指纹绑定。

## 证据边界

本轮未执行真实 SDK / tsc / Vite / Chromium；不可标 PASS。可 Mock 业务后端，但不能 Mock Mantine 后声称库验证成功。MIT，官方 https://mantine.dev/ 。

## 第11轮迁移补充

将 `examples/feed-history.ts` 与 `example.tsx` 一起迁走；选中项只保留业务 ID，使用函数式 `setFeedHistory` 更新并维护同状态的单步撤销快照。不能将领域规则 Node PASS 推断为 Mantine NumberInput/Modal 的真实SDK行为；运行浏览器时检查焦点返回、IME和 Portal 卸载。
