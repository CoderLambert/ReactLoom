import type { Meta, StoryObj } from '@storybook/nextjs'
import { Input } from './input'

const meta = {
  component: Input,
} satisfies Meta<typeof Input>

export default meta

type Story = StoryObj<typeof meta>

export const Email: Story = {
  args: { id: 'email', type: 'email', placeholder: 'ada@reactloom.dev' },
}
