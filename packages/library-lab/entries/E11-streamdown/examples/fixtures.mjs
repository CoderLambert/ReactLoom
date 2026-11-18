export const fixtures = {
  basic: {
    title: '累计分段输入与未闭合语法',
    objective: '接收半截强调和代码围栏，观察原始正文与渲染结果怎样逐步完成。',
    chunks: [
      '# 研究摘要\n\n',
      '正在汇总 **流式',
      ' Markdown**：每次传入的是累计正文。\n\n',
      '```ts\n',
      'const result = ',
      "'累计全文';\n",
      '```\n',
    ],
  },
  business: {
    title: '研究摘要与受控外链',
    objective: '把累计正文变成表格和任务列表，并为不可信来源限制链接、图片与原始 HTML。',
    chunks: [
      '# 前端研究摘要\n\n',
      '| 主题 | 条数 |\n| --- | ---: |\n',
      '| React | 8 |\n',
      '| 流式 UI | 5 |\n\n',
      '- [x] 已收集资料\n',
      '- [ ] 等待人工复核\n\n',
      '[官方说明](https://streamdown.ai/docs)\n\n',
      '[未知外站](https://example.com/unreviewed)\n\n',
      '[危险协议](javascript:alert%281%29)\n\n',
      '![远程图片](https://example.com/pixel.png)\n\n',
      '<img src="https://example.com/raw-pixel.png" alt="原始 HTML 图片" />\n\n<script>globalThis.__e11Unsafe = true</script>\n',
    ],
  },
}
