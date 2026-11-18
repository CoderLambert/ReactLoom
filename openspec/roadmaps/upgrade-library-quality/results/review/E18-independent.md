# E18 独立复核（2026-11-18）

非作者只读条目，唯一落盘此报告。由LIBRARY_CATALOG E18→library.json→agent.md→实际四运行文件/声明→guide/verification/local-validation取证。没有修改条目/共享文件，无全量检查、作者policy重跑、浏览器运行或Node音频SDK替身。

结论：**Spec PASS（源码/迁入范围）；Quality 有条件PASS，真实DOM SDK/browser及正式build NOT_RUN待主控。无阻断源码发现。** 选择波形+定位/速率/缩放合理，原生audio只播放时更简单；不是视频/HLS/剪辑/录音工具。

| 六项 | 独立状态 | 证据 |
| --- | --- | --- |
| 技术准确性 | PASS源码；SDK NOT_RUN | 实装8.0.3/BSD-3-Clause API和销毁顺序匹配，下面行号核对；Node试验仅自建fixture/策略 |
| 解释清晰 | PASS | 分开native播放与WebAudio解析、WAV设计与ready运行时duration、异步取消和物理decode限制 |
| Demo目标 | NOT_RUN | 三目标实际源码区分播放/seek/速率zoom；真实交互交主控 |
| 可迁入 | PASS | 四原件完整复制+新React consumer严格编译exit0，复用现有依赖非fresh-install |
| 官方材料 | PASS | 固定README及LICENSE重新HTTPS取得逐字节相同；metadata SHA匹配，原始header200未知嵌入状态合理 |
| 可复核结果 | NOT_RUN（DOM）；本地consumer PASS | 下列真实argv/cwd/exit/output；无作者测试复跑，无DOM/播放成功代称 |

## 实装实现核对

`node_modules/wavesurfer.js`实际package8.0.3/BSD-3-Clause。以下均从`packages/library-lab/node_modules/wavesurfer.js/dist/`读取，而不是凭旧v7经验：

- wavesurfer.js:100附近仅backend WebAudio时构造内部WebAudioPlayer；本例显式MediaElement且无外部media，使用内部原生audio。
- decoder.js:11–23每次decode创建AudioContext，try await decodeAudioData，finally在非closed时await close；它不是MediaElement播放context，也不等于destroy能物理取消已经开始的decode。
- wavesurfer.js:439–460终态/每次load独立scope；501–508使用scope真实AbortSignal fetch后检查；595 ready事件实参getDuration，701–707优先native时长否则decoded duration。UI从ready参数而非1.6常量显示，匹配。
- wavesurfer.js:663–669 zoom参数是像素/秒；本例max(1200,clientWidth×2/duration)理论总宽至少2倍，需真实renderer scrollWidth观测；不能仅选项文字证明缩放。790–793 WebAudio getMediaElement返回null，说明准确。
- wavesurfer.js:858–885先isDestroyed=true、emit destroy、plugins、scope.dispose（子load abort），清decodedData，renderer.destroy，player.destroy，unAll。player.js:199–212先dispose媒体bridge/revoke内部URL，然后仅自有media pause/remove src/load/remove。默认自有媒体适用，本例自己的输入blobURL另由finally撤销。
- 自有releaseWave逐个捕获off错误再尝试destroy，finally revoke；独立新输入证明两个off均throw仍destroy→revoke并返回两错误。revoke自身throw会向外传播；URL.revokeObjectURL正常合法URL不抛，该边界不构成当前问题。不能把off控制流double称SDK清理通过。

keyed level切换实例，alive/ref阻止迟到load/playPromise写入。ready前禁按钮；构造失败revoke；无远程音频/麦克风/storage/自有timer。scope abort、decoder close和原生媒体实际释放需主控外层探针验证，不能由DOM消失替代。

## 独立实际试验

复制example.tsx/wav.ts/wave-cleanup.mjs/wave-cleanup.d.mts，不含Lab demo。新consumer同时实例化basic和advanced。ES2022+DOM/ESNext/Bundler/react-jsx/strict/noEmit/skipLibCheck，现有node_modules symlink。新纯policy消费者检查两次fixture字节确定性、包络首尾、峰值范围，以及两off失败仍destroy/finallyrevoke、revoke失败传播。无WaveSurfer实例、AudioContext或decoder执行。

```json
[
  {
    "cwd": "/home/lambert/githubRepos/lambert/ReactLoom",
    "argv": [
      "pnpm",
      "exec",
      "tsc",
      "-p",
      "/tmp/e18-independent-4oe0fgp5/tsconfig.json"
    ],
    "exit": 0,
    "output": ""
  },
  {
    "cwd": "/home/lambert/githubRepos/lambert/ReactLoom",
    "argv": [
      "node",
      "/tmp/e18-independent-4oe0fgp5/trial.mjs"
    ],
    "exit": 0,
    "output": "{\"layer\":\"PURE_POLICY_NOT_SDK\",\"deterministicBytes\":25644,\"frames\":12800,\"peak\":9000,\"orderedCleanup\":[\"offA\",\"offB\",\"destroy\",\"revoke\"],\"offErrors\":2,\"revokeError\":\"propagates\"}\n"
  }
]
```

仅清理本次owned tmp目录。SDK执行数0；新policy consumer命令1通过；strict迁入命令1通过；作者policy2未复跑。

## 官方逐字节核对

```json
{
  "fetch": [
    {
      "url": "https://raw.githubusercontent.com/katspaugh/wavesurfer.js/f855c0ed1d535b94384e50d6ba335550db6ed2e2/README.md",
      "status": 200,
      "sameBytes": true,
      "sha256": "00a51b40c28bb7f24b7787c10695e5ea26bd23930762f49ebf2c8f712f2fc872"
    },
    {
      "url": "https://raw.githubusercontent.com/katspaugh/wavesurfer.js/f855c0ed1d535b94384e50d6ba335550db6ed2e2/LICENSE",
      "status": 200,
      "sameBytes": true,
      "sha256": "0fc992dc27cc34dde78bfeb024b4cadff6320f0dcbee2f1228efaeb533ca1364"
    }
  ],
  "localReadmeSha256": "00a51b40c28bb7f24b7787c10695e5ea26bd23930762f49ebf2c8f712f2fc872",
  "metadataSha256": "00a51b40c28bb7f24b7787c10695e5ea26bd23930762f49ebf2c8f712f2fc872"
}
```

固定tree证据候选README.md和src/reactive/README.md，无中文，en合理；license原字节为BSD3三条件及免责声明，实际package字段相符。首页source-evidence记录HTTP200、无XFO/frame-ancestors拒绝头，保留unknown而非推断allowed，正确；无Lab-origin iframe成功宣称。

## 非阻断建议与后续闭环

guide最后一段写`official/local-validation.md`，实际文件是entry根`local-validation.md`，建议下一次文档修订纠正路径（不影响迁入/验收）。真实触摸/音频设备/iOS/读屏未测已注明，不扩本批。

主控浏览器应验证真实ready1.6/canvas/native currentTime/seek0.8/playbackRate1.5/≥2x横向zoom恢复、外部audio pause去src/load、全部自有及SDK URL回收、decoder context close；held-fetch场景证明真实signal abort接线，不称真实网络或物理decode取消。主控已采用两提案并补无外网/held loader后URL释放，当前未在本报告取得运行日志，保留NOT_RUN。formal verification仍三NOT_RUN，需匹配candidate收据才能改PASS。
