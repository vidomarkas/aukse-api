"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBudget = createBudget;
exports.getBudgetsForHousehold = getBudgetsForHousehold;
exports.getBudgetById = getBudgetById;
exports.updateBudget = updateBudget;
exports.deleteBudget = deleteBudget;
exports.getBudgetSpending = getBudgetSpending;
const prisma_1 = require("../lib/prisma");
async function createBudget(input) {
    return prisma_1.prisma.budget.create({
        data: {
            ...input,
            startDate: new Date(input.startDate),
            endDate: input.endDate ? new Date(input.endDate) : undefined,
        },
        include: { category: true },
    });
}
async function getBudgetsForHousehold(householdId) {
    return prisma_1.prisma.budget.findMany({
        where: { householdId },
        include: { category: true },
        orderBy: { startDate: "desc" },
    });
}
async function getBudgetById(id) {
    return prisma_1.prisma.budget.findUnique({
        where: { id },
        include: { category: true },
    });
}
async function updateBudget(id, input) {
    return prisma_1.prisma.budget.update({
        where: { id },
        data: {
            ...input,
            ...(input.startDate && { startDate: new Date(input.startDate) }),
            ...(input.endDate && { endDate: new Date(input.endDate) }),
        },
        include: { category: true },
    });
}
async function deleteBudget(id) {
    return prisma_1.prisma.budget.delete({
        where: { id },
    });
}
// calculate how much has been spent against a budget in its period
async function getBudgetSpending(budgetId) {
    const budget = await prisma_1.prisma.budget.findUnique({ where: { id: budgetId } });
    if (!budget)
        return null;
    const now = new Date();
    const periodStart = budget.period === "monthly"
        ? new Date(now.getFullYear(), now.getMonth(), 1)
        : new Date(now.getFullYear(), 0, 1);
    const result = await prisma_1.prisma.transaction.aggregate({
        where: {
            householdId: budget.householdId,
            categoryId: budget.categoryId ?? undefined,
            type: "expense",
            date: { gte: periodStart },
            deletedAt: null,
        },
        _sum: { amountBase: true },
    });
    const spent = Number(result._sum.amountBase ?? 0);
    const limit = Number(budget.amount);
    return {
        budget,
        spent,
        remaining: limit - spent,
        percentage: Math.round((spent / limit) * 100),
    };
}
