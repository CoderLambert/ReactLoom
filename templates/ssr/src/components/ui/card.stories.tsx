import type { Meta, StoryObj } from '@storybook/nextjs'
import { Card, CardDescription, CardHeader, CardTitle } from './card'

const meta = {
  component: Card,
} satisfies Meta<typeof Card>

export default meta

type Story = StoryObj<typeof meta>

export const WarpBoard: Story = {
  args: {
    children: (
      <CardHeader>
        <CardTitle>Warp board</CardTitle>
        <CardDescription>Dress the loom</CardDescription>
      </CardHeader>
    ),
  },
}
