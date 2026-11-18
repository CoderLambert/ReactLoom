export interface PlannedTask {
  id: string
  start: string
  end: string
  progress: number
  dependencies: string
}
export const MAX_PLAN_SPAN_DAYS: 730
export const MIN_PLAN_DATE: '0101-01-01'
export const MAX_PLAN_DATE: '9998-12-31'
export function toChartTasks(
  tasks: readonly (PlannedTask & { name: string })[],
): (PlannedTask & { name: string })[]
export function validCivilDate(value: unknown): boolean
export function validatePlan(tasks: PlannedTask[]): string | null
