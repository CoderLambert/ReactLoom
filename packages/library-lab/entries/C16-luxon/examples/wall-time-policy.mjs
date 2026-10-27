// Accept a civil wall-clock value, not an instant or a loose Date.parse input.
const WALL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
export function assertWallTimeSyntax(value) {
  const match = typeof value === 'string' ? WALL.exec(value) : null;
  if (!match) throw new Error('本地时间必须为 YYYY-MM-DDTHH:mm，不能隐式附加机器时区');
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1] || hour > 23 || minute > 59) {
    throw new Error('非法本地日历时间');
  }
  return value;
}
