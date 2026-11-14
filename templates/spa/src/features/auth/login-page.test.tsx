import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '@/mocks/server'
import { renderApp } from '@/test/render'

describe('login page', () => {
  it('submits only once before async validation settles and permits retry after failure', async () => {
    let release = () => {}
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })
    let attempts = 0
    server.use(
      http.post('*/api/session', async () => {
        attempts += 1
        await pending
        return HttpResponse.json({ message: 'Sign-in failed.' }, { status: 401 })
      }),
    )

    const user = userEvent.setup()
    renderApp('/login')
    await user.type(await screen.findByLabelText('Email'), 'ada@reactloom.dev')
    await user.type(screen.getByLabelText('Password'), 'loom-demo')
    const form = screen.getByLabelText('Email').closest('form')
    if (!form) throw new Error('The sign-in form is missing.')

    try {
      // Both submit events happen before RHF's promise-based resolver completes.
      await act(async () => {
        fireEvent.submit(form)
        fireEvent.submit(form)
      })
      await waitFor(() => expect(attempts).toBe(1))
    } finally {
      release()
    }

    expect(await screen.findByRole('alert')).toHaveTextContent('Sign-in failed.')
    server.resetHandlers()
    await user.click(within(screen.getByRole('main')).getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('heading', { name: 'Warp board' })).toBeVisible()
  })

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
