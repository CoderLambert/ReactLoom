# F10 Orval 独立复核

结论：**Spec PASS；质量六维分层通过，无新增实质缺陷。** 只写本报告，未改entry/shared/队列、未跑作者三项目完整双次CLI、policy6或共享browser/build/full typecheck。生成SDK、产物消费、自建policy分开。

## 六维和范围

| 维度 | 状态 / 独立证据 |
| --- | --- |
| 技术准确 | PASS：实装Orval8.44.0 CLI配置按config所在目录解析，advanced tags-split按target父目录。新consumer严格检查原始19产物和响应union/hook类型，并实际调用生成URL helpers；无HTTP/Provider验证。 |
| 解释清楚 | PASS：生成≠网络≠响应运行时校验；原生fetch迁入模板需api-client mutator；Query hooks缺Provider/应用集成不冒称可直接运行。 |
| 实验有效 | PASS复用真实CLI记录：fetch单文件、Query hooks、按tag拆包三不同目标；每项目双次真实生成和摘要比较，不以文件数计SDK用例。 |
| 完整迁入 | PASS有明确适配合同：config、本地契约、run、output-policy、对应入口和generated-tsconfig均声明；run的Lab深度/配置路径需要迁出者适配已写明，非无条件即插即用。TS barrel导出.ts要求noEmit+allowImportingTsExtensions已声明。 |
| 官方可靠 | PASS已保存固定来源证据：包目录README/LICENSE/package对应commit f7c7afdb0dfc1b928d0f18b19a5d4287bddff9d5，README1784bytes/SHA与metadata一致；MIT/version8.44.0一致。官网记录GET403保持unknown，不猜测frame策略。 |
| 可复核验证 | PASS本地分层；正式NOT_RUN：双次CLI原始log和commands记录复用；独立19文件manifest无差异、新consumer严格编译通过、URL helpers运行通过、自建清理小consumer通过。browser只命令/来源展示，不当在线生成。 |

检索实际命令`node packages/library-lab/scripts/find-library.mjs --id F10 --agent`，cwd repo root，exit0。读library/agent/guide/verification、全部声明源、commands/rawCLI/manifest/官方source-evidence，未把目录recreated当验收PASS。

## 实装路径解析和产物证据

实装包路径：`/home/lambert/githubRepos/lambert/ReactLoom/node_modules/.pnpm/orval@8.44.0_@tanstack+react-query@5.104.1_react@19.3.0__msw@3.0.3_@types+node@22.20.5__4cd48d85566c3e35e926025e0d0051cf/node_modules/orval/package.json`。

独立读真实CLI `orval/dist/bin/orval.mjs:56–58`：findConfigFile(options.config)后workspace=path.dirname(configFilePath)，:75 normalizeOptions(config,workspace,options)，:77 generateSpec(workspace,...)。因此config里的`./openapi/news.json`/`./generated`按config目录正确；不是普通JS generate API所有调用均如此。`run.mjs`用Lab cwd启动pnpm但不改变这个CLI合同。advanced target为generated/advanced/client.ts，策略按advanced/检查，与当前真实输出相符。

作者raw两次CLI复用，不重跑：

```text
basic-cli-fixed.log: Orval v8.44.0 两次成功
files=6 sha256=7736739f32c8bdfe456c544c78bbf272f607ad2bc5ad138a0539c75a5fdb2fa5
business-cli-fixed.log: 两次成功
files=6 sha256=fcba05284087e80c5aad869934c74fded51781f6cc9c1dc5ae59e5f6547836ec
advanced-cli-final.log: 两次成功
files=7 sha256=f6e8522f6927a456025bdc81be7575dc1d76fb9f1b77837c01c15e8030f8a3ca
```

三条入口命令与exit0、初始路径/标签目录错误及tsc TS5097失败→修复→exit0链都保存。generated-types-final与config-and-generated-types日志配commands保存exit0，不只是声明。独立重新逐文件读磁盘，与artifact-manifest bytes/SHA比对原始19文件，输出`{"manifestFiles":19,"mismatches":[]}`，exit0。未格式化/修改产物，不混用另一次摘要。

## 新的最小迁入consumer

cwd `/home/lambert/githubRepos/lambert/ReactLoom`。ownedtmp `/tmp/f10-independent-dfionv2q`复制当前19 generated文件和实际orval.config.ts，node_modules链接Lab。strict/noEmit/ES2022/ESNext/Bundler/DOM/allowImportingTsExtensions/types[]/skipLibCheck（只跳第三方声明）。consumer内容：

```ts
import {getListSourcesUrl,getGetSourceUrl,type createSourceResponse} from './generated/basic'
import {getListSourcesQueryKey,useListSources} from './generated/business'
const url=getListSourcesUrl({limit:17})
if(!url.endsWith('/api/sources?limit=17'))throw Error(url)
if(!getGetSourceUrl('audit_42').endsWith('/api/sources/audit_42'))throw Error('path')
const error:createSourceResponse={status:409,data:{code:'DUP_AUDIT',message:'new conflict'},headers:new Headers()}
if(error.status!==409||error.data.code!=='DUP_AUDIT')throw Error('union')
export const typedHook=useListSources
export const queryKey=getListSourcesQueryKey({limit:17})
```

实际argv `pnpm --filter @reactloom/library-lab exec tsc -p /tmp/f10-independent-dfionv2q/tsconfig.json`，exit0，stdout/stderr空。19文件加config/consumer全部编译，不执行React hook，不发HTTP。ownedtmp已清理。

运行helpers直接使用本机Node26内置TS stripping：

```sh
node --input-type=module - <<'JS'
import {getListSourcesUrl,getGetSourceUrl} from './packages/library-lab/entries/F10-orval/examples/generated/basic.ts'
const url=getListSourcesUrl({limit:17});const detail=getGetSourceUrl('audit_42')
if(!url.endsWith('/api/sources?limit=17')||!detail.endsWith('/api/sources/audit_42'))throw Error('unexpected generated URL')
console.log(JSON.stringify({url,path:detail,scope:'actual generated URL helpers; no HTTP'},null,2))
JS
```

exit0，原始输出：

```json
{
  "url": "http://127.0.0.1:4319/api/sources?limit=17",
  "path": "http://127.0.0.1:4319/api/sources/audit_42",
  "scope": "actual generated URL helpers; no HTTP"
}
```

保留一次review harness失败：尝试用实装TypeScript7的transpileModule API转译运行helper，Node exit1 `TypeError: Cannot read properties of undefined (reading 'ES2022')`（ScriptTarget不存在），未执行helper。改直接Node原生TS stripping后成功。不是Orval产物失败，没有改entry或装包。新增Orval生成SDK进程0次，复用作者六次真实CLI，不把helper执行冒称新的生成覆盖。

## 独立自建清理consumer

Node inline import实际output-policy.mjs，ownedtmp创建basic.ts、business.ts、unrelated.txt。cleanProject(root,'basic')只删basic；确认business和unrelated字节保留。再以basic.ts指向unrelated的symlink调用cleanProject，必须拒绝；finally仅清ownedtmp。cwd同repo root，argv `node --input-type=module -`，exit0，输出：

```json
{"otherProjectPreserved":true,"unrelatedPreserved":true,"ownedSymlinkRefused":true,"scope":"self-authored output policy, not Orval SDK"}
```

这是1个小policy consumer的3断言，不计Orval SDK。静态核对clean只删固定projectPaths，不执行--clean；inspect递归拒绝symlink/非TS/超深/超量/超字节并验证导出，是自建检查而非Orval保证。run先清本项目固定路径再生成，两次读取比较path+code聚合SHA，child超时与缓冲有界。无用户schema/config路径输入；未知配置可执行代码的风险在guide明确。

## 交棒

无须作者整改。主控只需确认node-ci命令、源码、官方来源展示；HTTP、QueryProvider/缓存、服务端真实响应、fresh-install与新契约广泛支持均未验证，不预支。正式sdk/build/browser维持NOT_RUN合适。报告完成停写。
