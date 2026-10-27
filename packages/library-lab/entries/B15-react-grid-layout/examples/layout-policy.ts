/** Pure breakpoint and keyboard rules; react-grid-layout owns pointer interaction. */
export type GridCell = {
  i: string; x: number; y: number; w: number; h: number;
  minW?: number; maxW?: number; static?: boolean;
};

type Direction = -1 | 1;

export function projectCells<T extends GridCell>(items: readonly T[], columns: number): T[] {
  const cols = Math.max(1, Math.floor(columns));
  return items.map(item => {
    const minW = Math.max(1, Math.min(cols, item.minW ?? 1));
    const maxW = Math.max(minW, Math.min(cols, item.maxW ?? cols));
    const w = Math.max(minW, Math.min(maxW, item.w));
    return {...item, minW, maxW, w, x: Math.max(0, Math.min(cols - w, item.x))};
  });
}

/** Narrow layout is independent of the saved wide geometry. */
export function initialNarrowCells<T extends GridCell>(wide: readonly T[], columns = 6): T[] {
  let y = 0;
  return wide.map(item => {
    const next = {...item, x: 0, y, w: columns, maxW: columns, minW: Math.min(columns, item.minW ?? 1)};
    y += item.h;
    return next;
  });
}

export function sameGeometry(a: readonly GridCell[], b: readonly GridCell[]): boolean {
  return a.length === b.length && a.every(row => {
    const other = b.find(cell => cell.i === row.i);
    return !!other && row.x === other.x && row.y === other.y && row.w === other.w && row.h === other.h;
  });
}

/** Wide: horizontal cell movement; narrow: adjacent vertical order swaps. */
export function keyboardMove<T extends GridCell>(items: readonly T[], id: string, direction: Direction,
  columns: number, locked: readonly string[] = []): T[] | readonly T[] {
  const current = items.find(cell => cell.i === id);
  if (!current || current.static || locked.includes(id)) return items;
  if (columns <= 6) {
    const sorted = [...items].sort((a,b) => a.y - b.y || a.x - b.x);
    const index = sorted.findIndex(cell => cell.i === id);
    const other = sorted[index + direction];
    if (!other || other.static || locked.includes(other.i)) return items;
    return items.map(cell => cell.i === id ? {...cell, y: other.y} : cell.i === other.i ? {...cell, y: current.y} : {...cell});
  }
  const x = current.x + direction;
  if (x < 0 || x > columns - current.w) return items;
  return items.map(cell => cell.i === id ? {...cell, x} : {...cell});
}

export function keyboardResize<T extends GridCell>(items: readonly T[], id: string, direction: Direction,
  columns: number, locked: readonly string[] = []): T[] | readonly T[] {
  const current = items.find(cell => cell.i === id);
  if (!current || current.static || locked.includes(id)) return items;
  const minW = Math.max(1, current.minW ?? 1);
  const maxW = Math.min(columns - current.x, current.maxW ?? columns);
  const w = Math.max(minW, Math.min(maxW, current.w + direction));
  if (w === current.w) return items;
  return items.map(cell => cell.i === id ? {...cell, w} : {...cell});
}
