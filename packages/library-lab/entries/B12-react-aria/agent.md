# B12 React Aria Components

## 适用

需要可访问组合框、弹出列表和键盘/IME 行为时用 `react-aria-components`。它不替代服务端校验，也不等于 WCAG 签收。现成后台皮肤另选。

## 版本

`react-aria-components@1.21.0`，React 19.3.0。许可证 **Apache-2.0**。保持 `selectedKey`、`onSelectionChange`、`inputValue`、`onInputChange`、`ListBoxItem id`。不要按别的小版本文档改成另一套受控属性。

## 迁移

旧 alpha 的 `Item` 不能留。若文档示例使用 `value/onChange`，先核对 1.21 类型再动 Lab 文件。过滤权在应用：`defaultFilter={() => true}`。

## 不可删的清理

代际和 AbortController 在 advanced 的 effect cleanup 里一起前进。切换 level 清空选择。组合期间提交直接返回。禁用频道不能留下 key。确认要求 id 与输入文本一致。FormData 提交 id。

## 反例

div 按钮。半输入仍提交旧 id。onChange 里 trim。库过滤和应用过滤各做一次。只 abort 不比较代际。把中文标签当主键。禁用项仍写入 selectedKey。宣称装上库就完成了读屏验收。

## 测试断言

`tests/channel-policy.test.mts` 断言中文大小写过滤、禁用与名称不一致时 `confirmedChannel` 为 null、忙碌或查询未完成时 `queryRows` 为空。不证明 Popover、IME 候选框或屏幕阅读器。

## 真实限制

已挂载：受控 ComboBox、本地过滤、禁用项、240ms 本地查询、组合期不提交。未挂载：Dialog、FieldError、revision、React Hook Form、Query。延迟不是 HTTP。

## 证据

sdk、build、browser 为 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配 receipt。Actions run `41779873259` 是仓库级检查，不是本条目 PASS。文档：https://react-spectrum.adobe.com/react-aria/ComboBox.html
