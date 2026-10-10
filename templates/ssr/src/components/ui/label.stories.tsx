import type { Meta, StoryObj } from '@storybook/nextjs'
import { Label } from './label'

const meta = {
  component: Label,
} satisfies Meta<typeof Label>

export default meta

type Story = StoryObj<typeof meta>

export const Email: Story = {
  args: { htmlFor: 'email', children: 'Email' },
}
