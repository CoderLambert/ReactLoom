import type { Level } from './approval-model'
import ApprovalWorkbench from './approval-workbench'
import FlowPrimer from './flow-primer'

export default function Example({ level }: { level: Level }) {
  return (
    <>
      {level === 'basic' && <FlowPrimer />}
      <ApprovalWorkbench level={level} />
    </>
  )
}
