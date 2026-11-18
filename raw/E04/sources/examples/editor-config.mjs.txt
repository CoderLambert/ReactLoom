import { javascript } from '@codemirror/lang-javascript'
import { Compartment, EditorState } from '@codemirror/state'
import { basicSetup } from 'codemirror'
export function createEditorConfig() {
  const readOnly = new Compartment()
  return {
    readOnly,
    extensions: [
      basicSetup,
      javascript({ typescript: true }),
      EditorState.tabSize.of(2),
      readOnly.of(EditorState.readOnly.of(false)),
    ],
  }
}
