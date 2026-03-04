import { prisma } from "../lib/prisma"
import { CreateBudgetInput, UpdateBudgetInput } from "../schemas/budget"

export async function createBudget(input: CreateBudgetInput) {
  return prisma.budget.create({
    data: {
      ...input,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : undefined,
    },
    include: { category: true },
  })
}

export async function getBudgetsForHousehold(householdId: string) {
  return prisma.budget.findMany({
    where: { householdId },
    include: { category: true },
    orderBy: { startDate: "desc" },
  })
}

export async function getBudgetById(id: string) {
  return prisma.budget.findUnique({
    where: { id },
    include: { category: true },
  })
}

export async function updateBudget(id: string, input: UpdateBudgetInput) {
  return prisma.budget.update({
    where: { id },
    data: {
      ...input,
      ...(input.startDate && { startDate: new Date(input.startDate) }),
      ...(input.endDate && { endDate: new Date(input.endDate) }),
    },
    include: { category: true },
  })
}

export async function deleteBudget(id: string) {
  return prisma.budget.delete({
    where: { id },
  })
}

// calculate how much has been spent against a budget in its period
export async function getBudgetSpending(budgetId: string) {
  const budget = await prisma.budget.findUnique({ where: { id: budgetId } })
  if (!budget) return null

  const now = new Date()
  const periodStart = budget.period === "monthly"
    ? new Date(now.getFullYear(), now.getMonth(), 1)
    : new Date(now.getFullYear(), 0, 1)

  const result = await prisma.transaction.aggregate({
    where: {
      householdId: budget.householdId,
      categoryId: budget.categoryId ?? undefined,
      type: "expense",
      date: { gte: periodStart },
      deletedAt: null,
    },
    _sum: { amountBase: true },
  })

  const spent = Number(result._sum.amountBase ?? 0)
  const limit = Number(budget.amount)

  return {
    budget,
    spent,
    remaining: limit - spent,
    percentage: Math.round((spent / limit) * 100),
  }
}