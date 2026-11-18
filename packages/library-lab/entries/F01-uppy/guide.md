# Uppy Core 6.1.0：本地队列、批次拒绝与有界预览

需要多文件队列、限制事件及将来接传输插件时选择 Core；只做一次拖放可选 F02 react-dropzone，CSV解析选F03。当前三个目标共享一个真实Core实例模式：basic学习批次入队；business读取本地文本；advanced主动触发超大文件拒绝并清空。没有Uploader、上传调用、网络端点、凭据或百分比。

## 运行模型与实际错误

`@uppy/core@6.1.0` 是ESM，实际包字段与固定LICENSE为MIT。React页面effect创建Core，`autoProceed:false`；限制最多3份、每份1MiB（1,048,576字节）、扩展名txt/csv/md。列表从Core状态读取。扩展名、MIME和文件名都不是内容安全、身份或服务端配额证明。

`addFiles`不是“没有throw就全部成功”：6.1.0对类型、大小、已有重复文件发`restriction-failed`，同批其他合法文件仍可接收；总数量检查失败会拒绝整个新批次，例如已有2份再加2份不会只补1份。非限制的应用hook异常则抛AggregateError且该批不提交。本例比较前后真实id集合，显示新增/未新增和限制事件数量，事件数不等于拒绝文件数。临时收集器在finally中off；已有文件不会因新批失败被清掉。单文件`addFile`的throw契约不能套在`addFiles`上。

## 完整迁入

```bash
pnpm add @uppy/core@6.1.0
```

目标需React及React DOM、TypeScript、React类型和支持ESM的前端构建器。复制以下五份，保持相对路径：

| 文件 | 职责 |
| --- | --- |
| examples/example.tsx | 页面、原生input/drop、批次反馈、epoch |
| examples/local-queue.mjs | 真实Core工厂、状态投影、订阅与批次处理 |
| examples/local-queue.d.mts | 上述接口类型 |
| examples/preview-policy.mjs | 有界读取和文本策略 |
| examples/preview-policy.d.mts | 预览接口类型 |

```tsx
import UppyQueueExample from './example'
export default function Page() {
  return <UppyQueueExample level="business" />
}
```

无需Provider、CSS导入、环境变量或后端。Lab的`demo.tsx`只是宿主适配，不是迁入依赖。三个level都可独立挂载；外层`key={level}`确保切换销毁旧会话，StrictMode effect重建时使用新实例，不复用已destroy实例。此处迁入编译只验证现有安装依赖，不等于干净机器安装或浏览器运行。

## 预览边界

Core可接受1MiB文件；预览先检查Blob大小，仅允许≤12,000**字节**（十进制，不是12KiB），才调用一次arrayBuffer。fatal UTF-8拒绝非法编码；拒绝C0控制字符，TAB/LF/CR除外，并拒绝DEL。空文本合法。显示用Array.from截取≤4,000 Unicode码点，emoji不会被切开；这不是4,000字节，也不是字素簇计数。没有CSV解释、编码猜测、杀毒或HTML执行，预览仅React文本节点。

新增、删除、清空、下一次预览、场景切换和卸载均使generation失效，旧读取成功/失败都不能回写。Blob.arrayBuffer没有本例可用的abort；这是丢弃迟到结果，不是停止底层读取。预览失败先清旧结果，队列本身保留。

## 清理与失败

持久订阅file-added/file-removed/restriction-failed，清理先off三者再destroy。真实Core destroy会cancelAll清空文件、退订store并解绑浏览器online/offline监听；本例没有插件上传可取消。clear不会逐个发file-removed，所以按钮显式同步空列表。销毁后的对象仍有方法/事件接口，不宣称不可再调用、立即GC或所有内部延迟定时器均取消；外部持有File也不会被强制释放。

不要在render创建Core，不要把扩展名当安全扫描，不要将长期对象存储密钥放前端，不要用定时器假装上传。生产接XHR/Tus/S3需另装对应插件与服务端授权/校验；当前页面没有进行这些协议验收。

## 分层证据与官方材料

`tests/sdk.test.mjs`直接使用同源local-queue与真实Core，5项通过：部分接收/重复、数量与大小、hook异常、remove与clear、off+destroy文件引用清理。Node原生File/Blob，无DOM；不证明浏览器input/drop或窗口监听。`tests/policy.test.mjs`独立纯策略6项，不算SDK。`validation/browser.spec.ts`是主控浏览器方案副本，覆盖真实选择/drop/拒绝及外层延迟Blob读取后删除、新预览、卸载；尚未由作者运行。正式verification三项保持NOT_RUN，详见local-validation.md原始日志。

固定官方原文字节见official/readme.md：transloadit/uppy固定commit的Core包README；完整tree未发现中文README，因此语言en。不是把根README改写成SDK手册。MIT原文见official/LICENSE.txt。官网实际200响应头未出现X-Frame-Options/CSP，但没有Lab-origin iframe成功证据，所以仍unknown，提供直达；CORS头不证明可嵌入。
