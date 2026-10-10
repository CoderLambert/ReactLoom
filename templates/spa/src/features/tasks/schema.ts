import * as z from 'zod'

export const taskStatusSchema = z.enum(['open', 'done'])

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: taskStatusSchema,
  createdAt: z.string(),
})

export const taskListSchema = z.object({
  tasks: z.array(taskSchema),
})

export const createTaskSchema = z.object({
  title: z.string().trim().min(3).max(80),
})

export type Task = z.infer<typeof taskSchema>
export type TaskStatus = z.infer<typeof taskStatusSchema>
export type CreateTaskInput = z.infer<typeof createTaskSchema>
