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
  args:{title:'普通资讯源',tone:'neutral'},
  play:async({canvas})=>{
    await expect(canvas.getByRole('heading',{name:'普通资讯源'})).toBeVisible()
    await expect(canvas.getByRole('button',{name:'归档当前项'})).toBeEnabled()
  },
}

export const Business: Story = {
  args:{title:'已校验资讯源',tone:'success',onArchive:fn()},
  play:async({canvas,userEvent,args})=>{
    await userEvent.click(canvas.getByRole('button',{name:'归档当前项'}))
    await expect(canvas.getByRole('status')).toHaveTextContent('已归档')
    await expect(args.onArchive).toHaveBeenCalledTimes(1)
  },
}

export const Advanced: Story = {
  args:{title:'受限资讯源',tone:'blocked'},
  play:async({canvas,args})=>{
    await expect(canvas.getByRole('status')).toHaveTextContent('等待审核')
    await expect(canvas.getByRole('button',{name:'归档当前项'})).toBeDisabled()
    await expect(args.onArchive).not.toHaveBeenCalled()
  },
}
