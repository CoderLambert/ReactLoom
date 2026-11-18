import { $createParagraphNode, $createTextNode, $getRoot, type LexicalEditor } from 'lexical'
import { assertLexicalSnapshot } from './snapshot-policy.mjs'

// onError must rethrow SDK parsing errors; otherwise Lexical can return a partial state.
export function restoreSnapshot(editor: LexicalEditor, raw: string) {
  const parsed = editor.parseEditorState(assertLexicalSnapshot(raw))
  if (parsed.isEmpty()) throw new Error('空文档不可应用')
  editor.setEditorState(parsed)
}
export function resetDocument(editor: LexicalEditor) {
  editor.update(
    () => {
      $getRoot()
        .clear()
        .append($createParagraphNode().append($createTextNode('新的编辑草稿')))
    },
    { discrete: true },
  )
}
