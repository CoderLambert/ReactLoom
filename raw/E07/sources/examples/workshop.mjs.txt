import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import { auditMarkdownTree } from './audit-policy.mjs'
export const MAX_BYTES = 24_000
export const MAX_UI_UNITS = 12_000
export const samples = {
  basic: '# ReactLoom Note\n\nA **typed** Markdown document.\n\n## Getting started\n\n- one\n- two',
  business:
    '# RSS 订阅验收\n\n| 场景 | 状态 |\n| --- | --- |\n| 导入完成 | PASS |\n| 取消请求 | NOT_RUN |\n\n- [x] 记录失败\n- [ ] 检查原始来源\n\n~~旧方案~~',
  advanced:
    '# 不可信文章\n\n[安全来源](https://example.org)\n\n[危险操作](javascript:alert(1))\n\n<script>alert("not executed by remark")</script>\n\n![远程图片](https://tracking.invalid/1.gif)\n\n[引用链接][bad]\n\n[bad]: data:text/html,untrusted',
}
export function transformMarkdown(source) {
  if (typeof source !== 'string') throw new TypeError('Markdown 必须是字符串')
  if (new TextEncoder().encode(source).byteLength > MAX_BYTES)
    throw new Error('Markdown 输入超过 24,000 UTF-8 字节（不是24KiB）')
  const processor = remark().use(remarkGfm)
  const ast = processor.parse(source)
  // parse freezes/initializes parser extensions but does NOT run transform plugins.
  // Audit is our read-only policy, and stringify uses exactly this AST.
  const audit = auditMarkdownTree(ast)
  return { normalized: String(processor.stringify(ast)), audit }
}
