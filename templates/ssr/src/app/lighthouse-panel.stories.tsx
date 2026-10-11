import { LighthousePanel } from '@reactloom/devtools/panels'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { expect, fn, userEvent } from 'storybook/test'
import { Button } from '@/components/ui/button'

const meta = {
  title: 'Devtools/Lighthouse',
  component: LighthousePanel,
  args: {
    Button,
    onRun: fn(),
    onRefresh: fn(),
    state: { running: false, error: null, report: null },
  },
} satisfies Meta<typeof LighthousePanel>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: '运行开发页审计' }))
    await expect(args.onRun).toHaveBeenCalledOnce()
    await userEvent.click(canvas.getByRole('button', { name: '刷新报告' }))
    await expect(args.onRefresh).toHaveBeenCalledOnce()
  },
}

export const Running: Story = {
  args: { state: { running: true, error: null, report: null } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '审计进行中…' })).toBeDisabled()
    await expect(canvas.getByRole('status')).toHaveTextContent('报告会自动更新')
  },
}

export const Report: Story = {
  args: {
    state: {
      running: false,
      error: null,
      report: {
        url: 'http://127.0.0.1:4318/',
        fetchedAt: '2026-10-11T10:00:00.000Z',
        categories: [
          { id: 'performance', title: 'Performance', score: 0.87 },
          { id: 'accessibility', title: 'Accessibility', score: 1 },
          { id: 'best-practices', title: 'Best practices', score: 0.96 },
          { id: 'seo', title: 'SEO', score: 0.92 },
        ],
        metrics: [{ title: 'Largest Contentful Paint', value: '1.2 s' }],
        audits: [{ title: 'Reduce unused JavaScript', value: 'Potential savings of 120 KiB' }],
      },
    },
  },
}

export const Failed: Story = {
  args: {
    state: {
      running: false,
      error: 'Chrome 未找到。安装 Playwright Chromium 后重试。',
      report: null,
    },
  },
}
