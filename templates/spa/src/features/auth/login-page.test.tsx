import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@/test/render'

describe('login page', () => {
  it('explains invalid credentials and keeps the form accessible', async () => {
    const user = userEvent.setup()
    const { container } = renderApp('/login')
    const email = await screen.findByLabelText('Email')
    const password = screen.getByLabelText('Password')
    await user.click(within(screen.getByRole('main')).getByRole('button', { name: 'Sign in' }))
    expect(await screen.findAllByRole('alert')).toHaveLength(2)
    expect(email).toHaveAttribute('aria-invalid', 'true')
    expect(email).toHaveAttribute('aria-describedby', 'login-email-error')
    expect(password).toHaveAttribute('aria-invalid', 'true')
    expect(password).toHaveAttribute('aria-describedby', 'login-password-error')
    expect(screen.getByText(/invalid email/i)).toHaveAttribute('id', 'login-email-error')
    expect(document.getElementById('login-password-error')).toHaveAttribute('role', 'alert')

    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
    })
    expect(results.violations).toEqual([])
  })
})
