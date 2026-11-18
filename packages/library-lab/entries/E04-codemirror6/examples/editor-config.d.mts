import type { Compartment, Extension } from '@codemirror/state'
export function createEditorConfig(): { readOnly: Compartment; extensions: Extension[] }
