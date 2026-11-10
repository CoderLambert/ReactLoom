import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { Link, useSearch } from '@tanstack/react-router'
import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getActiveSession, useAuthStore } from '@/features/auth/store'
import { useCreateTask, useSetTaskStatus, useTasks } from '@/features/tasks/hooks'
import { type CreateTaskInput, createTaskSchema } from '@/features/tasks/schema'
import { isApiError } from '@/lib/api'

const filters = ['all', 'open', 'done'] as const

export function TasksPage() {
  const { t } = useTranslation()
  const { status } = useSearch({ from: '/tasks' })
  const tasks = useTasks()
  const create = useCreateTask()
  const update = useSetTaskStatus()
  const draftRevision = useRef(0)
  const submitting = useRef<{ version: number; revision: number } | null>(null)
  const form = useForm<CreateTaskInput>({
    resolver: standardSchemaResolver(createTaskSchema),
    defaultValues: { title: '' },
  })

  const titleError = form.formState.errors.title
  const titleDescriptionIds = [
    titleError && 'task-title-error',
    create.isError && 'task-create-error',
  ].filter(Boolean).join(' ')

  const visible = (tasks.data ?? []).filter((task) => status === 'all' || task.status === status)
  const errorMessage = isApiError(tasks.error)
    ? tasks.error.message
    : tasks.isError
      ? t('tasks.error')
      : null
  const updateError = isApiError(update.error)
    ? update.error.message
    : update.isError
      ? t('tasks.updateError')
      : null

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl space-y-2">
          <h1 className="text-5xl">{t('tasks.title')}</h1>
          <p className="text-muted">{t('tasks.body')}</p>
        </div>
        <nav className="flex gap-2" aria-label={t('tasks.title')}>
          {filters.map((filter) => (
            <Link
              key={filter}
              to="/tasks"
              search={{ status: filter }}
              aria-current={status === filter ? 'page' : undefined}
              className={
                status === filter
                  ? 'rounded-full bg-ink px-3 py-1 text-sm text-linen'
                  : 'rounded-full px-3 py-1 text-sm ring-1 ring-line'
              }
            >
              {t(`tasks.${filter}`)}
            </Link>
          ))}
        </nav>
      </div>

      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={async (event) => {
          const version = useAuthStore.getState().sessionVersion
          if (submitting.current?.version === version) {
            event.preventDefault()
            return
          }
          const attempt = { version, revision: draftRevision.current }
          submitting.current = attempt
          try {
            await form.handleSubmit(async (values) => {
              if (useAuthStore.getState().sessionVersion !== version || !getActiveSession()) return
              await create.mutateAsync(values.title)
              if (
                useAuthStore.getState().sessionVersion === version &&
                getActiveSession() &&
                draftRevision.current === attempt.revision
              ) {
                form.reset()
              }
            })(event)
          } catch {
            // Mutation errors are rendered below; keep the editable draft for retry.
          } finally {
            if (submitting.current === attempt) submitting.current = null
          }
        }}
      >
        <div className="grow space-y-2">
          <Label htmlFor="title">{t('tasks.titleLabel')}</Label>
          <Input
            id="title"
            placeholder={t('tasks.placeholder')}
            aria-invalid={titleError ? true : undefined}
            aria-describedby={titleDescriptionIds || undefined}
            {...form.register('title', {
              onChange: () => {
                draftRevision.current += 1
              },
            })}
          />
          {titleError ? (
            <p id="task-title-error" className="text-sm text-copper" role="alert">
              {titleError.message}
            </p>
          ) : null}
          {create.isError ? (
            <p id="task-create-error" className="text-sm text-copper" role="alert">
              {t('tasks.createError')}
              {isApiError(create.error) ? ` ${create.error.message}` : null}
            </p>
          ) : null}
        </div>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? t('tasks.adding') : t('tasks.add')}
        </Button>
      </form>

      {tasks.isPending ? <p>{t('tasks.loading')}</p> : null}
      {errorMessage ? (
        <div role="alert" className="space-y-3">
          <p>{errorMessage}</p>
          <Button variant="secondary" onClick={() => tasks.refetch()}>
            {t('tasks.retry')}
          </Button>
        </div>
      ) : null}
      {!tasks.isPending && !tasks.isError && visible.length === 0 ? (
        <p>{t('tasks.empty')}</p>
      ) : null}
      {updateError ? (
        <p className="text-sm text-copper" role="alert">
          {updateError}
        </p>
      ) : null}

      <ul className="divide-y divide-line overflow-hidden rounded-3xl bg-card ring-1 ring-line">
        {visible.map((task) => (
          <li key={task.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className={task.status === 'done' ? 'text-muted line-through' : 'font-medium'}>
                {task.title}
              </p>
              <p className="text-xs text-muted">{task.status}</p>
            </div>
            <Button
              variant="ghost"
              disabled={update.isPending || (create.isPending && task.id.startsWith('tmp-'))}
              onClick={() =>
                update.mutate({
                  id: task.id,
                  status: task.status === 'done' ? 'open' : 'done',
                })
              }
            >
              {task.status === 'done' ? t('tasks.reopen') : t('tasks.markDone')}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
