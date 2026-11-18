import { useEffect, useRef, useState } from 'react'
import type { NodeRendererProps } from 'react-arborist'
import {
  beginComposition,
  blockEnter,
  createCompositionGuard,
  endComposition,
  releaseEnter,
} from './ime-guard'
import type { Item } from './tree-model'

function Editor({ node }: Pick<NodeRendererProps<Item>, 'node'>) {
  const input = useRef<HTMLInputElement>(null)
  const guard = useRef(createCompositionGuard())
  const [value, setValue] = useState(node.data.name)
  useEffect(() => {
    input.current?.focus()
    input.current?.select()
  }, [])
  return (
    <input
      ref={input}
      className="c11-editor"
      aria-label={`重命名 ${node.data.name}`}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onCompositionStart={() => beginComposition(guard.current)}
      onCompositionEnd={(event) => {
        endComposition(guard.current)
        setValue(event.currentTarget.value)
      }}
      onBlur={() => node.reset()}
      onKeyDown={(event) => {
        event.stopPropagation() // This input owns editing keys, not the tree's shortcuts.
        const native = event.nativeEvent
        const blocked = blockEnter(guard.current, {
          key: event.key,
          isComposing: native.isComposing,
          keyCode: native.keyCode,
        })
        if (guard.current.composing || native.isComposing || native.keyCode === 229) return
        if (event.key === 'Escape') {
          event.preventDefault()
          node.reset()
        }
        if (event.key === 'Enter') {
          event.preventDefault()
          if (!blocked) node.submit(event.currentTarget.value)
        }
      }}
      onKeyUp={(event) => {
        event.stopPropagation()
        releaseEnter(guard.current, event.key)
      }}
    />
  )
}

export function TreeNode({ node, style, dragHandle }: NodeRendererProps<Item>) {
  return (
    <div ref={dragHandle} style={style} className="c11-node" data-node-id={node.id}>
      {!node.isLeaf && (
        <button
          type="button"
          tabIndex={-1}
          aria-label={`${node.isOpen ? '折叠' : '展开'} ${node.data.name}`}
          aria-expanded={node.isOpen}
          onClick={(event) => {
            event.stopPropagation()
            node.toggle()
          }}
        >
          {node.isOpen ? '▾' : '▸'}
        </button>
      )}
      {node.isLeaf && (
        <span aria-hidden="true" className="c11-leaf">
          •
        </span>
      )}
      {node.isEditing ? <Editor node={node} /> : <span className="c11-name">{node.data.name}</span>}
    </div>
  )
}
