// Requests may complete after a different tab replaced the httpOnly cookie.
// Never cache or render another account's tasks under the previous user ID.
export class TaskSessionMismatchError extends Error {
  constructor() {
    super('Task response does not match the current session. Please sign in again.')
    this.name = 'TaskSessionMismatchError'
  }
}

export function assertTaskForUser<T extends { ownerId: string }>(task: T, userId: string): T {
  if (task.ownerId !== userId) throw new TaskSessionMismatchError()
  return task
}

export function assertTasksForUser<T extends { tasks: readonly { ownerId: string }[] }>(
  result: T,
  userId: string,
): T {
  for (const task of result.tasks) assertTaskForUser(task, userId)
  return result
}
