// Typed constructor surface used by this demo, checked against frappe-gantt 1.2.2.
// Upstream ships JavaScript without declarations; add APIs only after checking its source.
declare module 'frappe-gantt' {
  export interface GanttTask {
    id: string;
    name: string;
    start: string;
    end: string;
    progress: number;
    dependencies: string;
  }

  export interface GanttOptions {
    view_mode?: 'Day' | 'Week' | 'Month';
    readonly?: boolean;
    popup?: false;
    scroll_to?: 'start';
  }

  export default class Gantt {
    constructor(
      wrapper: string | HTMLElement | SVGElement,
      tasks: GanttTask[],
      options?: GanttOptions,
    );
    refresh(tasks: GanttTask[]): void;
    change_view_mode(mode: 'Day' | 'Week' | 'Month', maintain_pos?: boolean): void;
  }
}

