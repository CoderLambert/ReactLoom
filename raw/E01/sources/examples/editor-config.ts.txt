import StarterKit from '@tiptap/starter-kit'
export const START = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '工程笔记' }] },
    { type: 'paragraph', content: [{ type: 'text', text: '编辑 Tiptap 示例，观察结构化文档。' }] },
  ],
}
// Reuse exactly this extension configuration when restoring snapshots.
export function createExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      link: {
        openOnClick: false,
        autolink: false,
        linkOnPaste: false,
        isAllowedUri: (value) => {
          try {
            const url = new URL(value)
            return (
              url.protocol === 'https:' && !url.username && !url.password && !/[\s\\]/u.test(value)
            )
          } catch {
            return false
          }
        },
      },
    }),
  ]
}
