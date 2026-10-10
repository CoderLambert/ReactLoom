import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@/test/render'

describe('login page', () => {
  it('explains invalid credentials and keeps the form accessible', async () => {
    const user = userEvent.setup()
    const { container } = renderApp('/login')
    await screen.findByLabelText('Email')
    await user.click(within(screen.getByRole('main')).getByRole('button', { name: 'Sign in' }))
    expect(await screen.findAllByRole('alert')).not.toHaveLength(0)

    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
    })
    expect(results.violations).toEqual([])
  })
})
