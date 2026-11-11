import { prisma } from "../lib/prisma"

/** A calendar month as a UTC date range: [start, end). Transaction dates are stored as plain dates. */
export type MonthRange = { start: Date; end: Date; key: string }

/** Parses "YYYY-MM" (defaults to the current month). Returns null if the value is invalid. */
export function monthRange(month?: string): MonthRange | null {
  let year: number
  let index: number
  if (month === undefined) {
    const now = new Date()
    year = now.getUTCFullYear()
    index = now.getUTCMonth()
  } else {
    const match = /^(\d{4})-(\d{2})$/.exec(month)
    if (!match) return null
    year = Number(match[1])
    index = Number(match[2]) - 1
    if (index < 0 || index > 11) return null
  }
  return {
    start: new Date(Date.UTC(year, index, 1)),
    end: new Date(Date.UTC(year, index + 1, 1)),
    key: `${year}-${String(index + 1).padStart(2, "0")}`,
  }
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}

export async function isHouseholdMember(userId: string, householdId: string) {
  const member = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId } },
    select: { id: true },
  })
  return member !== null
}

/** Expenses and income per month for the `months` months ending with `range` (inclusive), including empty months. */
export async function getMonthlyOverview(householdId: string, range: MonthRange, months: number = 6) {
  const from = new Date(Date.UTC(range.start.getUTCFullYear(), range.start.getUTCMonth() - (months - 1), 1))

  const transactions = await prisma.transaction.findMany({
    where: {
      householdId,
      deletedAt: null,
      date: { gte: from, lt: range.end },
      type: { in: ["expense", "income"] },
    },
    select: { amount: true, type: true, date: true },
  })

  const buckets = new Map<string, { key: string; month: string; expenses: number; income: number }>()
  for (let i = 0; i < months; i++) {
    const date = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + i, 1))
    const key = monthKey(date)
    buckets.set(key, {
      key,
      month: date.toLocaleString("en-GB", { month: "short", timeZone: "UTC" }),
      expenses: 0,
      income: 0,
    })
  }

  for (const tx of transactions) {
    const bucket = buckets.get(monthKey(new Date(tx.date)))
    if (!bucket) continue
    if (tx.type === "expense") bucket.expenses += Number(tx.amount)
    if (tx.type === "income") bucket.income += Number(tx.amount)
  }

  return [...buckets.values()]
}

export async function getSpendingByCategory(householdId: string, range: MonthRange) {
  const result = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      householdId,
      deletedAt: null,
      type: "expense",
      date: { gte: range.start, lt: range.end },
    },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
  })

  const categoryIds = result.map((r) => r.categoryId).filter(Boolean) as string[]
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
  })

  return result.map((r) => {
    const category = categories.find((c) => c.id === r.categoryId)
    return {
      categoryId: r.categoryId,
      name: category?.name ?? "Uncategorized",
      icon: category?.icon ?? null,
      color: category?.color ?? "#94a3b8",
      value: Number(r._sum.amount ?? 0),
    }
  })
}

export async function getCurrentMonthStats(householdId: string, range: MonthRange) {
  const where = { householdId, deletedAt: null, date: { gte: range.start, lt: range.end } }
  const [expenses, income] = await Promise.all([
    prisma.transaction.aggregate({ where: { ...where, type: "expense" }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { ...where, type: "income" }, _sum: { amount: true } }),
  ])

  const spent = Number(expenses._sum.amount ?? 0)
  const earned = Number(income._sum.amount ?? 0)

  return {
    spent,
    income: earned,
    balance: earned - spent,
    month: range.start.toLocaleString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }),
    key: range.key,
  }
}

/**
 * Spending per category in the month compared with the average of the previous `months` months.
 * For the current month, only days up to today are compared on both sides, so a half-finished
 * month isn't measured against whole months.
 */
export async function getCategoryChanges(householdId: string, range: MonthRange, months: number = 3) {
  const now = new Date()
  const isCurrent = range.key === monthKey(now)
  const upToDay = isCurrent ? now.getUTCDate() : 31
  const from = new Date(Date.UTC(range.start.getUTCFullYear(), range.start.getUTCMonth() - months, 1))

  const rows = await prisma.transaction.findMany({
    where: { householdId, deletedAt: null, type: "expense", date: { gte: from, lt: range.end } },
    select: { amount: true, date: true, categoryId: true },
  })

  const totals = new Map<string | null, { current: number; previous: number }>()
  for (const row of rows) {
    const date = new Date(row.date)
    if (date.getUTCDate() > upToDay) continue
    const entry = totals.get(row.categoryId) ?? { current: 0, previous: 0 }
    if (date >= range.start) entry.current += Number(row.amount)
    else entry.previous += Number(row.amount)
    totals.set(row.categoryId, entry)
  }

  const categoryIds = [...totals.keys()].filter(Boolean) as string[]
  const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } } })
  const round = (value: number) => Math.round(value * 100) / 100

  return {
    comparedMonths: months,
    upToDay: isCurrent ? upToDay : null,
    categories: [...totals.entries()].map(([categoryId, t]) => {
      const category = categories.find((c) => c.id === categoryId)
      return {
        categoryId,
        name: category?.name ?? "Uncategorized",
        icon: category?.icon ?? null,
        color: category?.color ?? "#9a9893",
        current: round(t.current),
        average: round(t.previous / months),
      }
    }),
  }
}

/** Things on the dashboard's "needs attention" strip. Budgets at risk are worked out in the web app. */
export async function getAttention(householdId: string, range: MonthRange) {
  const uncategorized = await prisma.transaction.aggregate({
    where: {
      householdId,
      deletedAt: null,
      type: "expense",
      date: { gte: range.start, lt: range.end },
      OR: [{ categoryId: null }, { category: { name: "Other", householdId: null } }],
    },
    _count: true,
    _sum: { amount: true },
  })

  // Where "Sort them" leads: the page listing everything in "Other".
  const other = await prisma.category.findFirst({ where: { name: "Other", householdId: null }, select: { id: true } })

  return {
    uncategorized: { count: uncategorized._count, amount: Number(uncategorized._sum.amount ?? 0) },
    otherCategoryId: other?.id ?? null,
  }
}

/**
 * Every expense in the month in the order it happened, plus last month's running total by day,
 * for the dashboard's "spending through the month" chart.
 */
export async function getSpendingTimeline(householdId: string, range: MonthRange) {
  const previousStart = new Date(Date.UTC(range.start.getUTCFullYear(), range.start.getUTCMonth() - 1, 1))

  const [transactions, previous] = await Promise.all([
    prisma.transaction.findMany({
      where: { householdId, deletedAt: null, type: "expense", date: { gte: range.start, lt: range.end } },
      select: {
        id: true,
        date: true,
        amount: true,
        currency: true,
        description: true,
        category: { select: { name: true, color: true, icon: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    }),
    prisma.transaction.findMany({
      where: { householdId, deletedAt: null, type: "expense", date: { gte: previousStart, lt: range.start } },
      select: { date: true, amount: true },
    }),
  ])

  const daysInPrevious = new Date(Date.UTC(range.start.getUTCFullYear(), range.start.getUTCMonth(), 0)).getUTCDate()
  const perDay = new Array<number>(daysInPrevious + 1).fill(0)
  for (const tx of previous) perDay[new Date(tx.date).getUTCDate()] += Number(tx.amount)
  // cumulative[d] = spent from day 1 to day d inclusive; cumulative[0] = 0
  const cumulative = perDay.map(((sum) => (value: number) => (sum += value))(0)).map((v) => Math.round(v * 100) / 100)

  return {
    month: range.key,
    transactions: transactions.map((tx) => ({
      id: tx.id,
      date: tx.date.toISOString().slice(0, 10),
      amount: Number(tx.amount),
      currency: tx.currency,
      description: tx.description,
      category: tx.category,
      user: tx.user,
    })),
    previous: { month: monthKey(previousStart), cumulative },
  }
}

/** A category's total and number of transactions per month, newest first, over all time. */
export async function getCategoryHistory(householdId: string, categoryId: string) {
  const [category, rows] = await Promise.all([
    prisma.category.findFirst({
      // Global categories (householdId null) or this household's own.
      where: { id: categoryId, OR: [{ householdId: null }, { householdId }] },
    }),
    prisma.transaction.findMany({
      where: { householdId, categoryId, deletedAt: null, type: { in: ["expense", "income"] } },
      select: { amount: true, date: true },
    }),
  ])
  if (!category) return null

  const months = new Map<string, { month: string; total: number; count: number }>()
  for (const row of rows) {
    const key = monthKey(new Date(row.date))
    const entry = months.get(key) ?? { month: key, total: 0, count: 0 }
    entry.total += Number(row.amount)
    entry.count += 1
    months.set(key, entry)
  }

  return {
    category: { id: category.id, name: category.name, icon: category.icon, color: category.color, isIncome: category.isIncome },
    months: [...months.values()]
      .map((m) => ({ ...m, total: Math.round(m.total * 100) / 100 }))
      .sort((a, b) => b.month.localeCompare(a.month)),
  }
}
