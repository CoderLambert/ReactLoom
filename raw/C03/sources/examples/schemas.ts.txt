import * as v from 'valibot'
import { canonicalHttpsFeedUrl, isRealCivilDate } from './boundary-policy.mjs'
// Schema declarations are ordinary application code; the input must remain unknown.
export const FeedSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(2, '名称至少2个字符')),
  url: v.pipe(
    v.string(),
    v.url('无效的URL'),
    v.check((url) => canonicalHttpsFeedUrl(url) !== null, '仅允许无凭据的 HTTPS 完整地址'),
  ),
  category: v.picklist(['tech', 'business'], '分类必须为tech或business'),
})
export const BatchSchema = v.object({
  feeds: v.pipe(
    v.array(FeedSchema),
    v.minLength(1, '至少选择一个RSS源'),
    v.maxLength(3, '一次最多导入3个RSS源'),
  ),
  owner: v.pipe(v.string(), v.trim(), v.minLength(2, '负责人至少2个字符')),
})
export const WindowSchema = v.pipe(
  v.object({
    start: v.pipe(
      v.string(),
      v.isoDate('日期须为YYYY-MM-DD'),
      v.check((value) => isRealCivilDate(value), '不存在的公历日期'),
    ),
    end: v.pipe(
      v.string(),
      v.isoDate('日期须为YYYY-MM-DD'),
      v.check((value) => isRealCivilDate(value), '不存在的公历日期'),
    ),
    note: v.optional(v.string('说明必须是文本')),
  }),
  v.forward(
    v.partialCheck(
      [['start'], ['end']],
      (input) =>
        !isRealCivilDate(input.start) || !isRealCivilDate(input.end) || input.start <= input.end,
      '结束日期不能早于开始日期',
    ),
    ['end'],
  ),
)

export type FeedInput = v.InferInput<typeof FeedSchema>
export type FeedOutput = v.InferOutput<typeof FeedSchema>
