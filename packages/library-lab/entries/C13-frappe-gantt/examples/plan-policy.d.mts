export interface PlannedTask {
  id: string;
  start: string;
  end: string;
  progress: number;
  dependencies: string;
}
export function validCivilDate(value: string): boolean;
export function validatePlan(tasks: PlannedTask[]): string | null;
