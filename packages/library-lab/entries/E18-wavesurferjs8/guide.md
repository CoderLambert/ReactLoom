# wavesurfer.js 8.0.3｜本地 WAV、波形和必须成对的 destroy

`library.json` 钉住 `wavesurfer.js@8.0.3`，BSD-3-Clause。它把音频画成波形并提供播放、定位和缩放。它不是视频播放器（E16），不是 HLS 引擎（E17），也不是转码器（E19）。

## Lab 当前示例

真实组件是 [`examples/example.tsx`](examples/example.tsx)。[`examples/demo.tsx`](examples/demo.tsx) 只再导出。音频在 [`examples/wav.ts`](examples/wav.ts) 的 `makeLabWave`：1.6 秒、8000 Hz、单声道 16-bit PCM。前 0.8 秒 330 Hz，后 0.8 秒 440 Hz，带简单包络。没有下载，没有第三方录音。

用户点开 Demo 之后，effect 才 `WaveSurfer.create` 并 `load`。换层由 `key={level}` 拆掉整个会话。没有 `localhost:5173`。

```ts
const url = URL.createObjectURL(makeLabWave())
const w = WaveSurfer.create({
  container: mount.current,
  waveColor: '#8cae99',
  progressColor: '#2c6c4b',
  cursorColor: '#265841',
  height: 100,
  normalize: false,
})
await w.load(url)
```

订阅了 `ready`、`timeupdate`、`play`、`pause`、`finish`、`error`。v8 的 `on` 返回退订函数，清理时逐个调用，然后 `destroy()`，再 `revokeObjectURL`。`alive` 标志挡住销毁后的 setState。

`playPause()` 的 Promise 若拒绝，只有在 ref 仍指向这个实例时才写错误。换层或销毁导致的拒绝不应打到下一个会话上。

| 层 | 控件 |
| --- | --- |
| basic | 播放 / 暂停 |
| business | 再加「跳到 0.8 秒」 |
| advanced | 再加 1× / 1.5× 和 zoom(120) / zoom(0) |

未 ready 时按钮禁用。时长显示固定对照 1.60 秒，位置来自 `timeupdate`。

没有挂载：远程 mp3、预计算 peaks 文件、麦克风、区域插件、时间轴插件、与 Video.js 同步。

页面说明：v8 的 `destroy` 是终态，离开后再用必须 `create` 新实例。`load` 被替换时可能出现 `AbortError`，catch 里忽略这一种，其他错误要显示。

## 1. 选型

| 任务 | 判断 |
| --- | --- |
| 播客或语音，要看到波形并点位置 | wavesurfer 8 |
| 只播放、不需要波形 | 原生 audio |
| 视频 | E16 |
| HLS | E17 |
| 把视频抽出音轨 | E19，再把 WAV 交给这里 |

BSD-3-Clause 要保留版权声明。示例音频是合成的，不包含音乐作品。

官方：[仓库](https://github.com/katspaugh/wavesurfer.js)、[发行](https://github.com/katspaugh/wavesurfer.js/releases)、[npm](https://www.npmjs.com/package/wavesurfer.js)。

## 2. 数据谁拥有

```text
makeLabWave() → Blob → object URL
        │
        ▼
WaveSurfer.create({ container })
        │ load(url)
        ▼
解码后的波形（实例内部）
        │ timeupdate / play / pause
        ▼
React 只存秒数、是否在播、状态文案
```

React 不保存 PCM。权威播放位置在实例里，`setTime` 只在 ready 之后调用，并且不超过 `getDuration()`。

预计算 peaks 可以避免再次解码大文件。本示例文件极小，没有 peaks 数组。不要把「没有 peaks」写成性能已优化，也不要虚构解码耗时。

## 3. 三层

在 Library Lab 打开 E18 再运行。波形容器有最小高度，避免 0 高度时看起来像没创建。

### 基本

状态变为「真实 WAV 已解码，可以播放」后点播放。再点变为暂停。结束时状态是「播放结束」。这 1.6 秒是教学长度，不是节目。

### 业务

「跳到 0.8 秒」调用 `setTime(0.8)`。预期听感从 330 Hz 换到 440 Hz 附近。没有新闻稿字段，也没有 RSS。

### 进阶

1.5× 使用 `setPlaybackRate`。放大使用 `zoom(120)`，复原 `zoom(0)`。缩放不是另一份音频。销毁之后这些方法不能再对旧实例调用。

## 4. 反例（带代码）

### 反例 1：不 destroy

```tsx
useEffect(() => {
  WaveSurfer.create({ container: el, url })
}, [])
```

容器里会留下画布和音频图。Lab 在清理函数里退订、`destroy`、revoke。

### 反例 2：destroy 之后还 play

```tsx
w.destroy()
await w.play()
```

v8 销毁是终态。要播放就新建。换层依赖 key，而不是在已销毁对象上 `load` 下一段。

### 反例 3：每个渲染 create

`create` 只在 effect 里，依赖是挂载。播放按钮只调用已有 ref。

### 反例 4：忽略 play 的拒绝

```tsx
onClick={() => wave.playPause()}
```

自动播放策略或已销毁的实例会拒绝 Promise。Lab 有 catch，并且比较 ref。

### 反例 5：把 AbortError 显示成故障

切换 load 时库可能中止上一次解码。catch 放行 `AbortError`，其他错误进入 status。不要空 catch 吞掉解码失败。

### 反例 6：远程 URL 当成本地演示

```tsx
w.load('https://cdn.example/theme.mp3')
```

本条目不请求音频。产品若要播用户文件，先做类型和大小限制，并用可撤销的 blob URL。

### 反例 7：用 innerHTML 写时间

时间放在 React 文本里。不要把曲目标题插进波形容器的 HTML。

### 反例 8：normalize 开了却拿振幅做测量

`normalize: false` 是为了不把短样本拉到满幅后误当成响度分析。这不是 LUFS 表。

## 5. 输入、请求、无障碍

没有文本输入。倍率是 select。按钮在解码前禁用。波形 div 有 `aria-label`。是否能用键盘点波形，没有收据。

中文不进入 PCM。若产品在旁边放标题输入框，不要在每次输入时 `destroy` 波形。

## 6. 故障

| 现象 | 先看 |
| --- | --- |
| 没有波形 | 容器高度、create 是否抛错、status |
| 播放失败 | catch 的文案。可能是策略拦截 |
| 换层后报 setState | `alive` 或退订被删了 |
| 跳转超过结尾 | `setTime` 是否用 `getDuration` 封顶 |
| 离开后仍有声音 | 是否 `destroy` |
| 内存里堆 blob | 是否 revoke |

## 7. 组合（未挂载）

**E16。** 视频走播放器，语音时间轴走 wavesurfer。不要两个库抢同一个 audio 元素。本示例自己 `load` Blob。

**E19。** 转码得到的 WAV 要先过输出校验，再 `createObjectURL` 交给新的 WaveSurfer。ffmpeg 的 GPL 核心不会因为波形库是 BSD 而改变。

**E17。** HLS 不是波形数据源。不要把 m3u8 丢给 `load`。

## 8. 同类

| 方案 | 何时 |
| --- | --- |
| wavesurfer 8.0.3 | 要波形和点击定位 |
| `<audio controls>` | 不需要图形 |
| Web Audio 自己画 | 要完全控制分析节点 |
| E16 | 画面为主 |

## 9. 升级核对

- 锁定 8.0.3。v7 的构造和销毁差异以发行说明为准，不要混用 `backend: 'MediaElement'` 的旧选项除非文档仍列出。
- `on` 的返回值要保存并调用。若升级后 API 改成 `un`，清理函数一起改。
- `destroy` 之后禁止复用同一对象。这条要留在代码评审清单里。

## 10. 练习（未挂载）

1. 连续挂载 10 次，确认每次离开都 revoke，并且听不到残留。不要编造内存字节数。
2. 用 E19 的 16 kHz WAV 替换 `makeLabWave`，同时改界面上的 1.60 秒文案，避免时长标签撒谎。

## 11. 验收

1. 打开后能解码本地 WAV，网络面板没有音频请求。
2. 播放、暂停、结束状态与按钮文字一致。
3. business 能跳到 0.8 秒。
4. advanced 能改倍速和缩放，销毁后不再发声。
5. `playPause` 拒绝时不写到已换掉的实例。

sdk、build、browser 保持 **NOT_RUN**。没有 `docs/library-lab/evidence/runs/` 的 E18 收据就不能写 PASS。Actions `41779873259` 是仓库级运行，不是本条目通过。

## 12. 资料

- https://github.com/katspaugh/wavesurfer.js
- https://github.com/katspaugh/wavesurfer.js/releases
- https://www.npmjs.com/package/wavesurfer.js
