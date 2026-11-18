import { adjustMoveIndex } from 'react-arborist'
import { type Item, insert, locate, withoutIds } from './tree-model.ts'

// Preserved remove-then-insert algorithm. The SDK supplies a pre-removal slot.
export function moveTree(
  nodes: Item[],
  dragIds: string[],
  parentId: string | null,
  index: number,
): Item[] {
  if (!dragIds.length) return nodes
  const siblings = locate(nodes, parentId)
  if (siblings === null) return nodes
  const targetIndex = adjustMoveIndex({
    index,
    dragIds,
    siblingIds: siblings.map((item) => item.id),
  })
  const { remaining, picked } = withoutIds(nodes, new Set(dragIds))
  if (!picked.length) return nodes
  return insert(remaining, parentId, targetIndex, picked) ?? nodes
}
