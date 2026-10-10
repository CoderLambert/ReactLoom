export type Task = {
  id: string
  title: string
  status: 'open' | 'done'
}

export function createTaskRepository(initial: Task[] = []) {
  let tasks = [...initial]
  return {
    list: () => tasks,
    create: (title: string) => {
      const task: Task = { id: `task-${tasks.length + 1}`, title, status: 'open' }
      tasks = [task, ...tasks]
      return task
    },
    setStatus: (id: string, status: Task['status']) => {
      tasks = tasks.map((task) => (task.id === id ? { ...task, status } : task))
    },
  }
}
