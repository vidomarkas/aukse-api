import { prisma } from "../lib/prisma"

export async function getMonthlyOverview(householdId: string, months: number = 6) {
  const from = new Date()
  from.setMonth(from.getMonth() - months)
  from.setDate(1)
  from.setHours(0, 0, 0, 0)

  const transactions = await prisma.transaction.findMany({
    where: {
      householdId,
      deletedAt: null,
      date: { gte: from },
      type: { in: ["expense", "income"] },
    },
    select: {
      amount: true,
      type: true,
      date: true,
    },
  })

  // group by month
  const map = new Map<string, { month: string; expenses: number; income: number }>()

  transactions.forEach((tx) => {
    const date = new Date(tx.date)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const label = date.toLocaleString("default", { month: "short", year: "numeric" })
    const existing = map.get(key) ?? { month: label, expenses: 0, income: 0 }
    if (tx.type === "expense") existing.expenses += Number(tx.amount)
    if (tx.type === "income") existing.income += Number(tx.amount)
    map.set(key, existing)
  })

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v)
}

export async function getSpendingByCategory(householdId: string) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const result = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      householdId,
      deletedAt: null,
      type: "expense",
      date: { gte: monthStart },
    },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
  })

  // fetch category details
  const categoryIds = result.map((r) => r.categoryId).filter(Boolean) as string[]
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
  })

  return result.map((r) => {
    const category = categories.find((c) => c.id === r.categoryId)
    return {
      name: category?.name ?? "Uncategorized",
      icon: category?.icon ?? null,
      color: category?.color ?? "#94a3b8",
      value: Number(r._sum.amount ?? 0),
    }
  })
}

export async function getCurrentMonthStats(householdId: string) {
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))

  const [expenses, income] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        householdId,
        deletedAt: null,
        type: "expense",
        date: { gte: monthStart },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        householdId,
        deletedAt: null,
        type: "income",
        date: { gte: monthStart },
      },
      _sum: { amount: true },
    }),
  ])

  const spent = Number(expenses._sum.amount ?? 0)
  const earned = Number(income._sum.amount ?? 0)

  return {
    spent,
    income: earned,
    balance: earned - spent,
    month: now.toLocaleString("default", { month: "long", year: "numeric" }),
  }
}
