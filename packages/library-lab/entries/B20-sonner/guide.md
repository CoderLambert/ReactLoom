# B20 Sonner：通知是事件投影

Sonner 用 `<Toaster />` 渲染短时提示，用 `toast()` 发出去。适合成功、失败、进行中和有限的撤销。不适合作为任务真相、审批记录、聊天收件箱、离线队列、表单字段错误的唯一位置，或必须被看见的风险声明。关掉通知不等于业务已处理。卸载界面不等于后台已取消。

Library Lab 固定 `sonner@2.0.8`，宿主 React 19.3.0。许可证 MIT。peer 覆盖 React 18 和 19。包是 React DOM 实现，不是 React Native。v2.0.7 起可以有多个 Toaster；2.0.8 修过空快捷键并增加自定义 aria 标签。CSS 入口是 `sonner/dist/styles.css`（若宿主没全局引入，通知仍可能没有官方皮肤；Lab 页面是否带上该 CSS 以宿主为准，不要在条目里声称样式已验收）。

## Lab 当前示例

`examples/demo.tsx` 再导出 `examples/example.tsx`。代际守卫是 `examples/latest-run.ts` 的 `LatestRunGuard`。没有 `toast.promise`，没有第二个 Toaster，没有真实 `fetch`。

已挂载：

- 一个 `<Toaster id="reactloom-b20-demo" position="bottom-right" theme="light" richColors closeButton duration={3500} visibleToasts={3} />`。所有 toast 带同一个 `toasterId`。
- basic：`toast()` 一条订阅成功，id 记入 `owned`。
- business：保存把 `saved` 设为 true，再发 `toast.success`，action「撤销」。`saveOwner` 每次保存发新 token。新的保存会 `dismiss` 上一条自己的成功 toast。撤销回调先看 `isCurrent(token)`，过期则 return。撤销把 `saved` 设回 false 并作废 token。
- advanced：`toast.loading` 且 `duration: Infinity`。900ms 后若 token 仍当前，用**同一个 id** `toast.success` 或 `toast.error` 更新，不堆第二条。勾选「模拟业务失败」在点击当时读入 `shouldFail`，之后再改勾选不影响这次。
- 再次点击会 `clearPending`：清定时器并 dismiss 进行中的 loading。
- `cancelOwn` 与 level 的 effect cleanup：`invalidate` 两个守卫，dismiss **每一个 owned id**。从不调用无参数的 `toast.dismiss()`，以免清掉页面上其他示例的通知。
- 业务句子在 `role="status"` 里一直在，不依赖 toast 是否还可见。

未挂载：`toast.promise`、多 Toaster、`useSonner()` 当账本、滑动关闭的真机手势、服务端补偿事务。撤销只改本地布尔。生产上的撤销要调用补偿接口；只 `setState(previous)` 不够。

## 什么时候使用

提交反馈、后台步骤的阶段结果、几秒内可撤销的操作。字段错误放在输入旁边。重要风险用对话框。长时间任务用可见的进度区域，loading toast 只是辅助，并且必须能结束。

## 模型

```text
按钮
  → LatestRunGuard.start()
  → toast(..., {toasterId, id?})
  → Toaster 订阅模块内状态并渲染 aria-live
  → 定时器回调只有 isCurrent 才改文案和业务状态
  → 卸载：dismiss(owned ids) + invalidate
```

Sonner 的状态不是 React Context 数据库，也不是 `AbortController`。Lab 的守卫只让回调失效，不会取消一个并不存在的网络请求。若接上 fetch，还要 abort，并且 abort 不等于服务器回滚。

| API | 作用 | 容易错 |
| --- | --- | --- |
| `Toaster id` | 容器 | 每个路由再挂一个却不规划归属 |
| `toast(message, {id, toasterId})` | 发或更新 | 每次重试新 id，堆成风暴 |
| `toast.loading` + `duration: Infinity` | 进行中 | 永不 dismiss |
| `toast.promise` | 随 Promise 转态 | 以为关掉就取消了 Promise。Lab 未使用 |
| `toast.dismiss(id)` | 关一条 | 无参数会关全部 |
| `action` | 按钮 | 只改前端，不叫补偿接口 |
| `onAutoClose` | 超时 | 把超时当成已读或提交成功 |
| `visibleToasts` | 最多同时几条 | 把被挤掉的当成业务删除 |

## 三层渐进

### Demo ① 成功提示（已挂载）

点一次出现一条。再点可以再出现，直到 `visibleToasts={3}` 开始挤掉更早的。挤掉不等于取消订阅。status 写「已触发基本通知」。

### Demo ② 撤销（已挂载）

保存后粗体变为已保存。点撤销只对最新一次有效。若实现错了，旧 toast 的按钮会把新保存也撤掉。Lab 用 token 挡住。dismiss 旧成功 toast，避免两个撤销按钮并存。

### Demo ③ 更新同一条（已挂载）

开始是 loading。成功或失败替换同一 id。连续点击只留下最后一次的结果。取消清掉本 demo 的计时器和通知，status 说明已停止。勾选失败后再跑，得到错误 toast，业务句是「任务失败」。这不是后端错误。

未挂载：`toast.promise(fetch(...))` 必须在 error 回调里留下表单错误，不能只换图标。`onDismiss` 与 `onAutoClose` 要分开，超时不要记成用户确认。

## 反例

```tsx
// 错：离开页面时关掉应用里所有通知
toast.dismiss();

// 对：只 dismiss 自己登记的 id
for (const id of owned.current) toast.dismiss(id);
```

```tsx
// 错：旧的撤销按钮作用于最新保存
action: {label: '撤销', onClick: () => setSaved(false)}

// 对：闭包里的 token 必须仍是 saveOwner 的当前值
```

```tsx
// 错：每次重试都 toast.loading 新 id
toast.loading('处理中');
toast.success('完成');

// 对：创建时记下 id，结束时 toast.success('完成', {id, toasterId})
```

```tsx
// 错：回调不看代际，取消后 900ms 仍把结果写成成功
window.setTimeout(() => setResult('任务成功'), 900);

// 对：if (!latestRun.current.isCurrent(token)) return;
```

```tsx
// 错：失败只存在 toast 里，3.5 秒后用户看不到原因
toast.error('失败');

// 对：role="status" 保留「任务失败」。字段错误还应靠近表单。Lab 没有表单字段
```

```tsx
// 错：把 getActiveToasts() 当持久队列写入数据库
// 对：业务状态在 React；toast 只是投影
```

Shadow DOM 里默认样式在 document head，需要时另处理。RTL、安全区和系统字体放大不要用写死的 offset 盖住。Lab 用 `bottom-right` 和 `visibleToasts={3}`，没有测移动端滑动关闭。

## 组合

**Sonner + Query**：mutation 的 `onSuccess` / `onError` 发通知，同时设置可见状态。`onSettled` 里 dismiss loading id。不要在通知回调里 `invalidate` 一次、在 mutation 里再 invalidate 一次导致竞态难以读。

**Sonner + 表单库**：422 写字段错误。toast 只说「请检查表单」。

**Sonner + AbortController**：取消按钮 abort 请求并 invalidate 守卫，然后 dismiss loading。服务器若已提交，UI 必须再 GET，而不是假设 abort 回滚。

多个 Toaster 时每个 id 固定归属。Lab 只有一个，并且 id 写成常量，避免和别的条目撞车。

## 生产清单

- 业务结果有不消失的文字。
- 进行中的 toast 一定有结束或取消。
- 撤销有代际，且生产上调用补偿。
- 更新用同一 id。
- 清理不用无参数 dismiss。
- 定时器放进集合，卸载时 clear。
- 不把自动关闭当成事务提交。
- 窄屏看位置是否挡住主按钮。Lab 未做该验收。
- 读屏听 `aria-live` 是否打断过重。库默认 polite，仍要听一次。

## 升级

2.0.8 的多容器和 aria 标签是可用能力。升级后回归：同一 id 更新、action 是否默认关闭、`toasterId` 是否仍必填才能进这个容器。不要把 `toast.promise` 教程贴进未使用它的示例却说已经处理取消。

## 生命周期补充

`toast.promise` 没有挂上。若生产要包一层请求，形状是：

```tsx
const id = toast.loading('正在保存', {toasterId, duration: Infinity});
try {
  await save(signal);
  toast.success('已保存', {id, toasterId});
} catch (error) {
  if (signal.aborted) toast.dismiss(id);
  else toast.error('保存失败', {id, toasterId});
}
```

关掉这条 loading 不会 abort `save`。取消按钮要同时 `signal.abort()`、`invalidate()` 和 `dismiss(id)`。服务器可能已经写入，所以失败分支不能假设数据没变。

`onAutoClose` 是计时结束，`onDismiss` 是用户关掉或滑掉。两者都不要当成「用户确认撤销窗口已过所以提交删除」。Lab 的撤销是按钮，不是超时。`duration: 3500` 只影响普通成功 toast；loading 被设成 `Infinity`，避免进行中自己消失。

`visibleToasts={3}` 会挤掉更早的基本通知。被挤掉的 id 可能还在 `owned` 集合里，卸载时对它再 `dismiss` 一次应当是安全的空操作；不要改成无参数 `dismiss` 来「清干净」。第二个 Toaster 若加在页面角落，必须用另一个 `id`，并且 `toasterId` 跟那一个对齐。Lab 只有 `reactloom-b20-demo`。

Shadow root 里官方样式默认进 document head，需要按官方说明把样式送进 shadow。RTL 和安全区不要写死 bottom offset。移动端滑动关闭尚未在本条目浏览器 receipt 里。

## 验收

basic：通知出现，status 同步，离开层级后这条 demo 的通知被按 id 关掉。business：保存为已保存；撤销后为未保存；旧按钮不能撤掉更新的保存。advanced：失败勾选得到错误且 status 为失败；连点只保留最后一次；取消后定时器不再改 status。全程没有无参数 `dismiss`。

sdk、build、browser 为 NOT_RUN。没有匹配 receipt 就不能写成 Sonner PASS。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件 / 153 项测试、45 个 Playwright，不是 B20 的 PASS。

```bash
node --experimental-strip-types --test packages/library-lab/entries/B20-sonner/tests/latest-run.test.mts packages/library-lab/entries/B20-sonner/tests/undo-ownership.test.mts
```

这些测试覆盖代际守卫和撤销所有权的纯逻辑（以仓库内断言为准）。它们不渲染 Toaster，也不证明实时区域。

## 官方资料

- https://sonner.emilkowal.ski/
- https://github.com/emilkowalski/sonner
- https://github.com/emilkowalski/sonner/releases/tag/v2.0.8
- https://github.com/emilkowalski/sonner/blob/main/LICENSE.md
- https://www.npmjs.com/package/sonner
