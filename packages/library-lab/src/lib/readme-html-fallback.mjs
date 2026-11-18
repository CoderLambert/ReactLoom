/** Preserve an HTML-only official snapshot as escaped code, not live HTML.
 * Mixed Markdown follows the existing skip/sanitize path unchanged. */
export function rehypeReadmeHtmlFallback({ source }) {
  return (tree) => {
    const meaningful = tree.children.filter(
      (node) => !(node.type === 'text' && typeof node.value === 'string' && !node.value.trim()),
    )
    if (
      typeof source !== 'string' ||
      !meaningful.length ||
      !meaningful.every((node) => node.type === 'raw')
    )
      return
    tree.children = [
      {
        type: 'element',
        tagName: 'pre',
        properties: {},
        children: [
          {
            type: 'element',
            tagName: 'code',
            properties: { className: ['language-html'] },
            children: [{ type: 'text', value: source }],
          },
        ],
      },
    ]
  }
}
