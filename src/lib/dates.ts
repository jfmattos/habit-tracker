export type Month = { year: number; month: number };

export const Weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Local-time date key in the form YYYY-MM-DD */
export function dateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function todayKey() {
  return dateKey(new Date());
}

export function currentMonth(): Month {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

export function addMonths({ year, month }: Month, amount: number): Month {
  const date = new Date(year, month + amount, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

export function isSameMonth(a: Month, b: Month) {
  return a.year === b.year && a.month === b.month;
}

export function monthLabel({ year, month }: Month) {
  return new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

/** Day numbers for a calendar grid starting on Sunday, with null for the leading blanks */
export function monthCells({ year, month }: Month) {
  const leading = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(leading).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(day);
  }
  return cells;
}

export function monthDateKey({ year, month }: Month, day: number) {
  return dateKey(new Date(year, month, day));
}
