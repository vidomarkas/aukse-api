/**
 * Due dates for recurring payments. All dates are calendar dates at midnight UTC,
 * matching how `@db.Date` columns are stored.
 */

export type Frequency = "daily" | "weekly" | "monthly" | "yearly"

export type RecurrenceRule = {
  frequency: Frequency
  /** Every N units, e.g. 2 with "weekly" = every two weeks. */
  interval: number
  startDate: Date
  endDate?: Date | null
}

const DAY = 24 * 60 * 60 * 1000

/** Midnight UTC of the given instant's UTC calendar date. */
export function toDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
}

/**
 * The k-th occurrence (k = 0 is the start date). Monthly and yearly payments keep the start
 * date's day: a payment starting on 31 Jan falls on 28/29 Feb, then 31 Mar again.
 */
export function occurrence(rule: RecurrenceRule, k: number): Date {
  const start = toDateOnly(rule.startDate)
  const step = k * rule.interval
  switch (rule.frequency) {
    case "daily":
      return new Date(start.getTime() + step * DAY)
    case "weekly":
      return new Date(start.getTime() + step * 7 * DAY)
    case "monthly":
    case "yearly": {
      const months = rule.frequency === "monthly" ? step : step * 12
      const total = start.getUTCMonth() + months
      const year = start.getUTCFullYear() + Math.floor(total / 12)
      const monthIndex = ((total % 12) + 12) % 12
      const day = Math.min(start.getUTCDate(), daysInMonth(year, monthIndex))
      return new Date(Date.UTC(year, monthIndex, day))
    }
  }
}

/** A rough lower bound for k so long-running rules don't iterate from the start. */
function estimateIndex(rule: RecurrenceRule, date: Date) {
  const days = (toDateOnly(date).getTime() - toDateOnly(rule.startDate).getTime()) / DAY
  const unitDays = { daily: 1, weekly: 7, monthly: 31, yearly: 366 }[rule.frequency]
  return Math.max(0, Math.floor(days / (unitDays * rule.interval)) - 1)
}

/** True when the date is past the rule's end date. */
function isAfterEnd(rule: RecurrenceRule, date: Date) {
  return !!rule.endDate && date.getTime() > toDateOnly(rule.endDate).getTime()
}

/** The first occurrence on or after `date`, or null when the rule has ended by then. */
export function firstOnOrAfter(rule: RecurrenceRule, date: Date): Date | null {
  const target = toDateOnly(date).getTime()
  for (let k = estimateIndex(rule, date); ; k++) {
    const due = occurrence(rule, k)
    if (isAfterEnd(rule, due)) return null
    if (due.getTime() >= target) return due
  }
}

/** The occurrence after `due` (an occurrence of this rule), or null when the rule has ended. */
export function nextAfter(rule: RecurrenceRule, due: Date): Date | null {
  return firstOnOrAfter(rule, new Date(toDateOnly(due).getTime() + DAY))
}

/** Every occurrence from `from` to `to`, both inclusive. */
export function occurrencesBetween(rule: RecurrenceRule, from: Date, to: Date): Date[] {
  const result: Date[] = []
  const end = toDateOnly(to).getTime()
  for (let due = firstOnOrAfter(rule, from); due && due.getTime() <= end; due = nextAfter(rule, due)) {
    result.push(due)
  }
  return result
}

/** Roughly what the rule costs per month, for totals like "€86 a month in subscriptions". */
export function monthlyEquivalent(amount: number, frequency: Frequency, interval: number) {
  const perYear = { daily: 365, weekly: 52, monthly: 12, yearly: 1 }[frequency] / interval
  return (amount * perYear) / 12
}
