# D02 独立复核（2026-11-18）

对象：当前 dirty tree 的 `entries/D02-lodash`；仅写本报告，未改条目、共享脚本、索引或验证状态。按 library-lab-quality 及三份 references 复核，读取根/本包/条目规则、COORDINATION、IMPLEMENTATION、REPAIR、library/agent/guide、实际声明源码、SDK suite、browser proposal、verification 与官方快照。其他人的大量改动保留。

## 结论

静态内容与独立最小真实 SDK 试用通过，没有发现需要返工的已确认条目缺陷。整体质量验收尚未完成：真实浏览器交互由主控在稳定快照运行；此报告不把静态覆盖或 Node SDK 结果当成 IME/React 卸载 PASS。合规复核 PASS；完整质量结论 NOT_RUN（待浏览器）。正式 sdk/build/browser 均保持 NOT_RUN 合理。

两个实验有不同目标：集合实验改变运算顺序，观察保留首条 81 还是最高分 99；生命周期实验操作真实 400ms debounce、flush、cancel、组合事件及卸载。数据和观察器属于本地 fixture/自建 React 逻辑，五个工具函数来自真实 lodash-es，不涉及后端或请求取消。

## 独立执行证据

cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`。

未复制作者四测试套件；独立 Node ESM consumer 直接导入 `uniqBy, orderBy, groupBy, chunk, debounce`，使用不同的三行 fixture（同 id 分数 1/9，另一行 3），断言首条=1、排序后=9、分组结果 `[9,3]`、chunk 长度 `[1,1]`。独立 debounce wait=25ms：连续 earlier/latest，65ms 后只收到 latest；flush 后再等65ms不重复；cancel 后再等65ms无新增。原命令为 `node --input-type=module` stdin 脚本，退出0，输出：

```text
Independent consumer PASS: collection first/highest + group/chunk; natural trailing coalescence; flush no duplicate; cancel across wait; pinned README SHA256. Real lodash-es 4.18.1
```

最小声明源码类型检查：

```sh
pnpm exec tsc --ignoreConfig --noEmit --strict --skipLibCheck --jsx react-jsx --module esnext --moduleResolution bundler --target es2022 entries/D02-lodash/examples/example.tsx
```

退出0，无诊断。首次未加 `--ignoreConfig` 返回 TS5112（安装的 TS7 不接受存在 tsconfig 时直接指定文件），按诊断补参后通过；未修改配置。此命令只证明独立 TSX consumer 的类型，不是全包构建。

README：Node crypto SHA256 本地 bytes 等于 metadata 的 `6a80dd853473be2c615faeafcb6479900353d04cedf6b7aab5c34a1fc16ac35a`。独立请求 `https://api.github.com/repos/lodash/lodash/contents/README.md?ref=454999199c880707789e941d14e5a62e0c7527fa` 返回200，base64 解码 bytes 与快照逐字节相同。输出 `README upstream bytes PASS; pinned root entries README candidates: [ 'README.md' ]`，退出0。保存的固定提交根目录树只有英文 README 候选；README v4.18.1 的 Module Formats 包含 lodash-es，guide 明确是官方根 README，并未冒充 ESM 专属接入指南。

检索入口先运行 `node packages/library-lab/scripts/find-library.mjs --id D02 --agent`，返回 `Error: Invalid D01-es-toolkit: invalid official README metadata`。使用根 LIBRARY_CATALOG 的 D02 路径继续，不为其他条目改数据。该共享检索失败不能归到 D02。主控通知 D01 语言枚举修正后，本复核重新运行同命令，退出0，返回 D02 与 agent 内容，检索阻塞已解决。Biome 根进程退出254是主控已知基础设施问题，本次没有重复执行；源码静态排版清晰，未据此声称 lint PASS。

## 六维复核

|维度|状态、层级|具体依据|
|---|---|---|
|技术准确|PASS：静态+真实 SDK|4.18.1 安装包 debounce.js 的 cancel/flush 与文档一致；uniqBy 保留首条，orderBy 多键方向，groupBy 数组值，chunk 非并发限制；独立 consumer 实测以上语义。|
|解释清楚|PASS：静态|guide 从选型、81/99 顺序差异到实例所有权；明确 async 请求失败、abort、旧响应隔离和重试是业务责任，cancel 不取消已发请求。|
|Demo 有用|NOT_RUN：设计通过、交互待跑|两个不同问题均有输入、观察结果和真实 SDK；浏览器待主控运行，不能从源码判定实际 IME/卸载通过。|
|源码可迁移|PASS：静态+最小 TSX 类型检查|唯一必需实现 example.tsx；demo.tsx 只重导出；deps lodash-es4.18.1/@types4.17.12，React/DOM/TS/ESM-TSX 前提齐全，无 CSS/provider/env/config。稳定父回调/useMemo/effect cancel、IME ref 和外层 observer timer 清理均存在。|
|官方来源可靠|PASS：固定来源/字节核对|repo/ref/path/version/lang/date/hash 齐全，独立 GitHub API bytes 匹配；本地原始 homepage headers 记载 SAMEORIGIN，blocked 与不同源一致，非 iframe load 推断。未独立重新检查官网实时响应。|
|结果可复核|NOT_RUN：SDK局部通过、完整运行待补|独立 SDK consumer/TSX/README 证据如上；verification 未冒充正式 PASS，browser 尚无本轮运行证据。|

## 浏览器提案审查

`validation/browser.spec.ts` 路由分别选择 basic/advanced；集合前后断言真实标题。第二用例 flush 后等待500ms无重复、cancel 后等待500ms无新增；compositionstart 后填入中间文本，等待500ms仍无新增，再 compositionend 等最终中文提交；新词后立即卸载，等外层650ms观察完成并检查事件数组未增加；重挂载恢复提交。外层观察器保留、事件记录保留，确实比“组件消失”更强。

提案与现有按钮/标签/testids 一致，未发现阻止执行的 selector 或逻辑错误。合成 composition 证明事件策略，不证明真实输入法候选体验。可选增强：在开始时连续 fill 两个值，超过400ms断言仅末值一次，直接覆盖浏览器中的自然 trailing 合并；当前提案主要通过 flush 观察末值，独立 Node consumer 已覆盖自然合并，但不能替代 React 浏览器运行。非阻断建议。

仍需：主控运行该 browser 提案并保留命令/输出；正式收据仍需符合 recorder 的干净完整输入合同。无须为这次只读复核运行全包构建或重跑已知异常 lint。
