import type { Meta, StoryObj } from '@storybook/nextjs'
import LoginPage from './page'

const meta = {
  title: 'Features/Login',
  component: LoginPage,
} satisfies Meta<typeof LoginPage>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
