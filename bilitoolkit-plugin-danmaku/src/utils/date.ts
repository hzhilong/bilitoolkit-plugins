import dayjs from 'dayjs'

export function getMonthRange(startDate: Date, endDate: Date): Date[] {
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
  const months: Date[] = []
  const current = new Date(start)
  while (current <= end) {
    months.push(new Date(current))
    current.setMonth(current.getMonth() + 1)
  }
  return months
}

export function getMonthRangeStr(start: Date, end: Date): string[] {
  return getMonthRange(start, end).map((d) => dayjs(d).format('YYYY-MM'))
}
