export interface PlannedTask {
  id: string;
  start: string;
  end: string;
  progress: number;
  dependencies: string;
}
export const MAX_PLAN_SPAN_DAYS: 730;
export function validCivilDate(value: string): boolean;
export function validatePlan(tasks: PlannedTask[]): string | null;
