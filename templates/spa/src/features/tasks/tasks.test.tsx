import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { demoUser } from '@/mocks/fixtures'
import { renderApp } from '@/test/render'

describe('tasks feature', () => {
  it('signs in, lists tasks, and creates one', async () => {
    const user = userEvent.setup()
    renderApp('/login')

    await user.type(await screen.findByLabelText('Email'), demoUser.email)
    await user.type(screen.getByLabelText('Password'), demoUser.password)
    await user.click(within(screen.getByRole('main')).getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('heading', { name: 'Warp board' })).toBeVisible()
    expect(await screen.findByText('Dress the loom')).toBeVisible()

    await user.type(screen.getByLabelText('Task title'), 'Beat the weft')
    await user.click(screen.getByRole('button', { name: 'Add task' }))
    expect(await screen.findByText('Beat the weft')).toBeVisible()
  })
})
