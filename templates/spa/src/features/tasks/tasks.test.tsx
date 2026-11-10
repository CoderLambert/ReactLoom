import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { demoUser } from '@/mocks/fixtures'
import { server } from '@/mocks/server'
import { renderApp } from '@/test/render'

afterEach(cleanup)

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

  it('links an invalid task title to its announced error and permits correction', async () => {
    const user = userEvent.setup()
    renderApp('/login')
    await user.type(await screen.findByLabelText('Email'), demoUser.email)
    await user.type(screen.getByLabelText('Password'), demoUser.password)
    await user.click(within(screen.getByRole('main')).getByRole('button', { name: 'Sign in' }))
    await screen.findByText('Dress the loom')

    let posts = 0
    server.use(
      http.post('*/api/tasks', () => {
        posts += 1
        return HttpResponse.json(
          {
            id: 'validated-task',
            title: 'Weave the warp',
            status: 'open',
            createdAt: '2026-11-09T00:00:00.000Z',
          },
          { status: 201 },
        )
      }),
    )

    const title = screen.getByRole('textbox', { name: 'Task title' })
    await user.click(screen.getByRole('button', { name: 'Add task' }))
    expect(await screen.findByRole('alert')).toHaveAttribute('id', 'task-title-error')
    expect(title).toHaveAttribute('aria-invalid', 'true')
    expect(title).toHaveAttribute('aria-describedby', 'task-title-error')
    expect(posts).toBe(0)

    await user.type(title, 'Weave the warp')
    await user.click(screen.getByRole('button', { name: 'Add task' }))
    expect(await screen.findByText('Weave the warp')).toBeVisible()
    await waitFor(() => expect(title).not.toHaveAttribute('aria-invalid'))
    expect(title).not.toHaveAttribute('aria-describedby')
    expect(posts).toBe(1)
  })

  it('preserves the draft and announces a failed creation before a successful retry', async () => {
    const user = userEvent.setup()
    renderApp('/login')

    await user.type(await screen.findByLabelText('Email'), demoUser.email)
    await user.type(screen.getByLabelText('Password'), demoUser.password)
    await user.click(within(screen.getByRole('main')).getByRole('button', { name: 'Sign in' }))
    await screen.findByText('Dress the loom')

    let attempts = 0
    server.use(
      http.post('*/api/tasks', async ({ request }) => {
        attempts += 1
        if (attempts === 1) {
          return HttpResponse.json({ message: 'Temporary outage.' }, { status: 503 })
        }
        const { title } = (await request.json()) as { title: string }
        return HttpResponse.json(
          { id: 'task-retried', title, status: 'open', createdAt: new Date().toISOString() },
          { status: 201 },
        )
      }),
    )

    const title = screen.getByRole('textbox', { name: 'Task title' })
    await user.type(title, 'Retry this task')
    await user.click(screen.getByRole('button', { name: 'Add task' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not add the task. Try again.')
    expect(title).toHaveValue('Retry this task')
    expect(title).toHaveAttribute('aria-describedby', 'task-create-error')

    await user.click(screen.getByRole('button', { name: 'Add task' }))
    await waitFor(() => expect(title).toHaveValue(''))
    expect(screen.queryByText('Could not add the task. Try again.')).not.toBeInTheDocument()
    expect(attempts).toBe(2)
  })
})
