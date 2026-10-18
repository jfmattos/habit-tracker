export type Month = { year: number; month: number };

/** Weeks start on Monday throughout the app */
export const Weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** 0 for Monday through 6 for Sunday */
export function weekdayIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

/** The Monday of the week containing `key` */
export function weekStart(key: string) {
  return addDays(key, -weekdayIndex(parseKey(key)));
}

/** Local-time date key in the form YYYY-MM-DD */
export function dateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function todayKey() {
  return dateKey(new Date());
}

export function parseKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(key: string, amount: number) {
  const date = parseKey(key);
  date.setDate(date.getDate() + amount);
  return dateKey(date);
}

export function daysBetween(from: string, to: string) {
  return Math.round((parseKey(to).getTime() - parseKey(from).getTime()) / 86_400_000);
}

export function dayLabel(key: string) {
  const today = todayKey();
  if (key === today) return 'Today';
  if (key === addDays(today, -1)) return 'Yesterday';
  return parseKey(key).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
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

/** Day numbers for a calendar grid starting on Monday, with null for the leading blanks */
export function monthCells({ year, month }: Month) {
  const leading = weekdayIndex(new Date(year, month, 1));
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
