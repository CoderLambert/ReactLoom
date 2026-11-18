import * as z from 'zod'
import { canonicalHttpsFeedUrl, isSafeOpmlFilename } from './boundary-policy.mjs'

const HttpsUrl = z
  .string()
  .trim()
  .url()
  .refine((value) => canonicalHttpsFeedUrl(value) !== null, '仅允许无凭据的 HTTPS 完整地址')
export const FeedSchema = z.strictObject({
  title: z.string().trim().min(2, '标题至少两个字符'),
  url: HttpsUrl,
})
export const ImportEventSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('rss'), url: HttpsUrl }),
  z.strictObject({
    kind: z.literal('opml'),
    filename: z.string().trim().refine(isSafeOpmlFilename, '必须为不含目录的 .opml 文件名'),
    groups: z.array(z.string().min(1)).min(1),
  }),
])
// 先拒绝空字符串，避免 JS Number('') = 0 被误认为合法 TTL。
const TTL = z
  .string()
  .trim()
  .min(1, '请填写 TTL')
  .regex(/^[1-9]\d?$/u, 'TTL 必须是十进制正整数')
  .pipe(z.coerce.number<string>().int().min(1).max(60))
export const BatchPolicySchema = z
  .strictObject({
    ttlMinutes: TTL,
    sources: z.array(FeedSchema).min(1).max(5),
  })
  .superRefine((policy, context) => {
    const seen = new Set<string>()
    policy.sources.forEach((source, index) => {
      const key = canonicalHttpsFeedUrl(source.url)
      if (key === null) return // Let the URL field validator report malformed values.
      if (seen.has(key)) {
        context.addIssue({
          code: 'custom',
          path: ['sources', index, 'url'],
          message: '批次内不允许重复 URL',
        })
      }
      seen.add(key)
    })
  })

export type Feed = z.output<typeof FeedSchema>
export type BatchInput = z.input<typeof BatchPolicySchema>
export type BatchOutput = z.output<typeof BatchPolicySchema>
