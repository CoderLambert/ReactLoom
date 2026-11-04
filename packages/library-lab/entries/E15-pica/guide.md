# pica 10.0.3｜浏览器里的像素缩小，不是上传组件

`library.json` 钉住 `pica@10.0.3`，MIT。pica 把一幅画布高质量缩小到另一幅画布，并可 `toBlob`。它不选择文件、不裁剪构图、不上传。v10 的入口是工厂函数 `pica()`，不是旧教程里的一些默认单例写法。

## Lab 当前示例

真实组件是 [`examples/example.tsx`](examples/example.tsx)。[`examples/demo.tsx`](examples/demo.tsx) 只再导出。尺寸和类型在 [`examples/resize-policy.mjs`](examples/resize-policy.mjs)。`PicaExample` 用 `key={level}` 包一层 `PicaSession`，换层丢弃文件和结果。

用户点开 Demo 之后才执行 `useMemo(() => pica(), [])`。没有 CDN 脚本，也没有 `localhost:5173`。

挂载的调用：

- 示例画布 1280×800，由 `paint` 画渐变和文字，不下载图片。
- 按钮才 `resizer.resize(source, target, { cancelToken })`，然后 `resizer.toBlob(target, 'image/png')`。
- 最长边只允许 240、480、800。`targetDimensions` 只缩小不放大。
- business 起可选本地 png、jpeg、webp，最大 4MiB。解码后像素超过 1600 万拒绝。`createImageBitmap` 在 finally 里 `close()`。
- advanced 另外用原生 `drawImage` 得到一张对照 PNG。字节数差不是画质结论，页面写明了这一点。
- 取消：`cancelToken` 的 reject，外加 generation。取消或换边长、换文件会作废旧结果。
- 单飞：`operationRef` 在函数入口同步置位，避免 React disabled 挡不住的第二次点击。新任务要等旧 Promise 结束才真正跑完 finally。
- 卸载时 generation 递增并调用当前的 cancel。

没有挂载：`unsharpAmount` 等滤镜参数、WebWorker 的自定义路径、把结果 POST 到服务器、image-blob-reduce。Worker 是否创建、CSP 是否允许，页面只提示需要浏览器验证，**没有收据**。

## 1. 决策

| 任务 | 判断 |
| --- | --- |
| 把大图缩到封面尺寸，人在浏览器里完成 | 适合 pica |
| 先决定裁哪一块 | E14，然后再缩小 |
| 只显示缩略图、不在乎算法 | 可以先用 Canvas，对照见 advanced |
| 上传或断点续传 | 别的库。pica 只出 Blob |
| 服务端批量转码 | 不要把 wasm 或 pica 说成转码集群 |

## 2. 数字的含义

源画布的宽高是像素，不是 CSS 像素的布局宽度。示例画布显示成最多 360 CSS 像素，位图仍是 1280×800。内存大致随宽乘高涨。4MiB 是文件上限，1600 万是解码像素上限，两者都要卡。

目标尺寸：`scale = min(1, longEdge / max(width, height))`，再四舍五入，并且至少 1。所以 800 的边不会把 1280 的图放大。

## 3. API

```ts
const resizer = pica()
await resizer.resize(source, target, { cancelToken })
const blob = await resizer.toBlob(target, 'image/png')
```

| 点 | Lab |
| --- | --- |
| `pica()` | 每个会话一个实例，`useMemo` |
| `resize` | 按钮触发，带 cancelToken |
| `toBlob` | 只编码 pica 的目标画布 |
| 原生 drawImage | 仅 advanced 对照 |
| Worker | 库自己的空闲策略。本文件不传自定义 worker 路径 |

v10 迁移要以仓库说明为准：[pica](https://github.com/nodeca/pica)。不要把 v7 的调用原样贴进 `pica()` 的选项里。补充阅读：[image-blob-reduce](https://github.com/nodeca/image-blob-reduce)，本示例没有用它。

取消令牌是一个会 reject 的 Promise，不是 `AbortSignal`。Lab 在用户点取消时 reject 它。`resize` 已经结束后，取消只防止 `toBlob` 的结果回写，因为令牌在 resize 结算后被清掉。这是源码里的注释，不要写成「toBlob 也可被同一令牌打断」的更强保证。

## 4. 三层

在 Library Lab 打开 E15，运行，再点「调用 pica 缩放」。

### 基本

源是画布上的「ReactLoom / pica」。默认最长边 480。完成后显示 PNG。未点按钮时不应有缩小结果。

### 业务

选文件后旧结果失效。不合法类型在 `checkSourceFile` 抛错，不进入解码。整个过程没有上传。

### 进阶

两张图并排。文件大小可以不同。不要根据谁更小判断谁更清晰。取消按钮只在 `running` 时可用。

## 5. 反例（带代码）

### 反例 1：把 CSS 宽度当导出尺寸

```tsx
<img style={{ width: 480 }} />
```

布局变小，文件没变。要调用 `resize`。

### 反例 2：每个渲染 `pica()`

```tsx
const resizer = pica()
```

放在组件函数体里会反复建实例。Lab 用 `useMemo`。换 level 由外层 key 重建会话。

### 反例 3：不看取消，总是 setState

```ts
await resizer.resize(source, target)
setResultBlob(await resizer.toBlob(target, 'image/png'))
```

换边长或卸载后会把旧图写回来。比较 generation。

### 反例 4：并行两次 resize

共用一个实例又同时写两块目标，是竞态。Lab 单飞，并在状态里说明要等旧 Promise。

### 反例 5：用字节数当质量分

```ts
score = nativeBlob.size < picaBlob.size ? 'native' : 'pica'
```

advanced 的说明禁止这个结论。

### 反例 6：跳过像素检查

只看 `file.size` 挡不住解压炸弹。`checkSourcePixels` 在 `drawImage` 之前。

### 反例 7：把 Worker 失败当成功能已关闭

pica 可能在 Worker 不可用时走主线程。没有控制台记录就不能说「已在 Worker 中完成」或「CSP 已允许」。本指南两句都不写。

### 反例 8：从 CDN 加载 pica

依赖来自包管理器里的 `pica@10.0.3`。不要再插脚本标签。

## 6. 怎么测才算数

看输出宽高是否符合 `targetDimensions`，看取消后状态不再被旧 Blob 覆盖，看离开页面后是否还在跑。视觉对比要人眼或固定夹具，不能用文件大小。Worker 与 CSP 要看浏览器的网络和安全面板。现在没有这些收据。

## 7. 组合（未挂载）

**E14 → pica。** 裁剪出一块画布，再缩到 480。裁剪像素和缩放像素都要过各自的上限。

**选择文件的库。** 选择和 MIME 可以在外面做，但进入 `loadIntoCanvas` 前仍要 `checkSourceFile`。不要信任组件库已经限额。

**上传。** Blob 准备好之后才进队列。失败保留本地预览 URL，成功后再 revoke 或交给下一页。

## 8. 故障

| 现象 | 先看 |
| --- | --- |
| 按钮点了没结果 | 是否抛在解码。status 里有失败字符串 |
| 尺寸没变小 | 源的长边是否已经小于目标。策略不放大 |
| 取消后仍出现图 | generation 判断是否被删 |
| 第二次点不到 | 旧任务是否还占用 `operationRef`。这是单飞 |
| 内存高 | bitmap 是否 close，结果 URL 是否 revoke |
| 和原生看起来一样 | 允许。不要编造差异百分比 |

## 9. Worker、CSP 与 v10 迁移

pica 10 可以在 Worker 里做重采样，也可以在 Worker 起不来时回到主线程。Lab 没有传入 `createWorker` 或自定义脚本 URL，因此实际走哪条路径取决于库的默认和页面的 CSP。要核对的是：

- `worker-src` 是否允许库要创建的 blob 或同源 Worker。
- 控制台是否出现 Worker 构造失败后的回退。
- 回退时按钮是否仍能在主线程完成，而不是一直停在「正在调用真实 pica.resize…」。

这三件事都要在浏览器里看。现在没有收据，所以既不能写「Worker 已启用」，也不能写「已确认回退到主线程」。

取消令牌和 Worker 的关系：reject `cancelToken` 是在请求库中断这次 `resize`。它不销毁整个 `pica()` 实例。下一次按钮会复用 `useMemo` 里的同一个 resizer。卸载会话时外层 `key` 会丢掉这个实例；不要在已卸载的组件上再 `resize`。

从旧版迁到 10.0.3 时：

- 调用写成 `const resizer = pica()`，再使用返回对象的 `resize` / `toBlob`。
- 不要保留「导入 pica 就是单例、可以并发」的假设。本示例故意单飞。
- `toBlob` 的 MIME 固定 `image/png`。若要 jpeg，质量和透明通道是另一组参数，当前策略和界面都没有。
- 滤镜选项（例如锐化）没有设置。加上去之后，advanced 的原生对照就不再只差缩放算法，对比结论要重写。
- 示例画布的 CSS 宽度约 360，位图仍是 1280×800。验收时量 `canvas.width`，不要量布局框。
- `sampleCanvas` 在 effect 里绘制一次。若绘制抛错，按钮会在执行时看到「示例画布不存在」或 Canvas 不可用，而不是一张空白成功图。
- 本地文件路径在 `loadIntoCanvas` 里先 `checkSourceFile`，再 `createImageBitmap`，再 `checkSourcePixels`。跳过中间任何一步都会把策略和界面说成两套。
- 结果图的 `alt` 分别是「真实 pica 生成的缩小图像」和「原生 Canvas 缩放对照图」。读屏文案不要改成质量评分。
- 三个最长边按钮和策略集合是同一份：240、480、800。界面若增加 1024，必须先改 `ALLOWED_LONG_EDGES`，否则一点就失败。
- 取消按钮只在 `running` 为真时可用。单飞期间第二次「调用 pica 缩放」会被 `operationRef` 直接返回，不会排队成第二次 resize。
- 对照图只在 advanced 且原生 `toBlob` 成功后出现。pica 成功、原生编码失败时，应只看到失败状态，不要补一张假的对照图。

`pica()` 返回的对象可以活过多次按钮点击，但活不过换层。`key={level}` 会卸掉整个 `PicaSession`，连同文件选择和两张结果图。不要把 resizer 提到这个 key 外面去「省一次初始化」，否则 business 的本地文件会留在 basic 的会话里。

卸载清理还会调用当时的 `cancelRef`。已经开始的 `toBlob` 若在卸载后结算，generation 已经变了，不能再 `setResultBlob`。这条和「Worker 是否还在跑」是两件事，后者没有收据。

## 10. 升级核对

- 使用 `pica()` 工厂，锁定 10.0.3。
- `resize` 的选项只传本文件已有的 `cancelToken`，除非你读过 v10 文档再加。
- 最长边集合改了就要改 `ALLOWED_LONG_EDGES` 和界面上的 select，避免界面能选出策略拒绝的值。

## 11. 练习（未挂载）

1. 把 E14 的 PNG 画进源画布再缩小。验收：输出长边不超过所选值，取消不回写。
2. 在支持的浏览器里看是否出现 Worker。只记录观察到的脚本 URL，不把一次观察写成所有浏览器的结论。

## 12. 验收

1. 未点按钮没有结果图。
2. 480 边的输出尺寸与策略函数一致。
3. 取消或换文件后旧 PNG 不出现。
4. advanced 的两张图都有字节说明，且文案不比较质量。
5. 没有上传请求。

sdk、build、browser 保持 **NOT_RUN**。没有 `docs/library-lab/evidence/runs/` 的 E15 收据就不能写 PASS。Actions `41779873259` 是仓库级运行，不是本条目通过。

## 13. 资料

- https://github.com/nodeca/pica
- https://www.npmjs.com/package/pica
- https://github.com/nodeca/image-blob-reduce
