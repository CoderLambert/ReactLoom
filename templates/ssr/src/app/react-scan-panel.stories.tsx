import { ReactScanPanel } from '@reactloom/devtools/panels'
import { createScanController } from '@reactloom/devtools/scan-controller'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { expect, userEvent } from 'storybook/test'
import { Button } from '@/components/ui/button'

const controller = createScanController(() => {})
const meta = {
  title: 'Devtools/React Scan',
  component: ReactScanPanel,
  args: { controller, Button },
  beforeEach: () => controller.configure(false, false),
} satisfies Meta<typeof ReactScanPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Controls: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: '开启扫描' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('运行中')
    await userEvent.click(canvas.getByRole('checkbox'))
    await expect(canvas.getByRole('checkbox')).toBeChecked()
    await userEvent.click(canvas.getByRole('button', { name: '暂停扫描' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('已暂停')
  },
}
