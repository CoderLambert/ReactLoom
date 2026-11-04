import type {Meta,StoryObj} from '@storybook/react-vite'
import {expect,fn} from 'storybook/test'
import {StatusCard} from '../components/StatusCard'

const meta = {
  title:'Library Lab/F14 StatusCard',
  component:StatusCard,
  tags:['autodocs'],
  args:{title:'新闻源审核',tone:'neutral',onArchive:fn()},
} satisfies Meta<typeof StatusCard>

export default meta
type Story=StoryObj<typeof meta>

export const Basic: Story = {
  args:{title:'普通资讯源',tone:'neutral',onArchive:fn()},
  play:async({canvas,args})=>{
    await expect(canvas.getByRole('heading',{name:'普通资讯源'})).toBeVisible()
    await expect(canvas.getByRole('status')).toHaveTextContent('待处理')
    await expect(canvas.getByRole('button',{name:'归档当前项'})).toBeEnabled()
    await expect(args.onArchive).not.toHaveBeenCalled()
  },
}

export const Business: Story = {
  args:{title:'已校验资讯源',tone:'success',onArchive:fn()},
  play:async({canvas,userEvent,args})=>{
    const button = canvas.getByRole('button',{name:'归档当前项'})
    await expect(canvas.getByRole('status')).toHaveTextContent('任务成功')
    await userEvent.click(button)
    await expect(canvas.getByRole('status')).toHaveTextContent('已归档')
    await expect(canvas.getByRole('button',{name:'已归档'})).toBeDisabled()
    await expect(args.onArchive).toHaveBeenCalledTimes(1)
  },
}

export const Advanced: Story = {
  args:{title:'受限资讯源',tone:'blocked',onArchive:fn()},
  play:async({canvas,args})=>{
    await expect(canvas.getByRole('status')).toHaveTextContent('等待审核')
    await expect(canvas.getByRole('button',{name:'归档当前项'})).toBeDisabled()
    await expect(args.onArchive).not.toHaveBeenCalled()
  },
}

// A rejected mutation must not accidentally show success or disable retry.
const recoveryArchive = fn()
export const Recovery: Story = {
  args:{title:'网络异常重试',tone:'neutral',onArchive:recoveryArchive},
  play:async({canvas,userEvent})=>{
    recoveryArchive.mockReset()
    recoveryArchive.mockRejectedValueOnce(new Error('local fixture rejected'))
    await userEvent.click(canvas.getByRole('button',{name:'归档当前项'}))
    await expect(canvas.getByRole('status')).toHaveTextContent('归档失败，可重试')
    await expect(canvas.getByRole('button',{name:'归档当前项'})).toBeEnabled()
    await userEvent.click(canvas.getByRole('button',{name:'归档当前项'}))
    await expect(canvas.getByRole('status')).toHaveTextContent('已归档')
    await expect(recoveryArchive).toHaveBeenCalledTimes(2)
  },
}
