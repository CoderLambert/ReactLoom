import type { Meta, StoryObj } from '@storybook/nextjs'
import { Button } from './button'

const meta = {
  component: Button,
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: { children: 'Weave', variant: 'primary' },
}

export const Secondary: Story = {
  args: { children: 'Warp', variant: 'secondary' },
}

export const Ghost: Story = {
  args: { children: 'Weft', variant: 'ghost' },
}
