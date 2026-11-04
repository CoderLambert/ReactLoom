# C19 nuqs — 工程手册

## 适用

可分享的筛选、分组和页码。不要存放 token、草稿长文或服务端错误。适配器必须是 TanStack Router 这一份。

## 版本

`nuqs@2.10.1`，MIT。从 `nuqs` 引入 `useQueryState`、`parseAsString`、`parseAsInteger`，从 `nuqs/adapters/tanstack-router` 引入 `NuqsAdapter`。不要用 `nuqs/parsers` 或 Next 适配器。

## 迁移

带走 `examples/example.tsx` 和 `examples/url-policy.mjs`。键保持 `ll_c19_` 前缀，除非产品路由确认没有冲突。搜索继续 `history: 'replace'`。需要后退的翻页才 `push`。清洗函数留在 URL 写入和列表过滤两边。

## 不可删的清理

组合期间不要 `commit`，也不要用 URL 覆盖 draft。卸载没有额外的订阅要拆，但不要在 unmount 后继续 `setQuery`。清空参数用 `null`。basic 必须忽略残留分组。

## 反例

```tsx
useQueryState('page', parseAsInteger.withOptions({ history: 'push' }))
useEffect(() => setDraft(query), [query])
```

- 搜索每个按键都 push。
- 认为整数 parser 已经排除负数。
- `await setQuery()` 当成接口成功。
- `limitUrlUpdates` 当成 fetch 防抖。
- 把密钥放进查询串。
- 同一键使用两套 parser。

## 测试断言

- 控制字符被去掉，长度按码点不超过 80。
- basic 的分组恒为 `all`。
- 非法页码变成 1，超出最后一页被夹住。
- 空搜索得到 `null` 而不是空键。
- 策略单测没有适配器和浏览器历史。

## 真实限制

五条数据是本地数组。没有 Query、没有 SSR `createSearchParamsCache`。advanced 的 push 只有页码。中文 IME 需要 browser 收据。`sanitizeQuery` 不是授权。

## 证据

没有收据不要写 PASS。Actions 41779873259 不是本条目。不要改 `verification.json`。
