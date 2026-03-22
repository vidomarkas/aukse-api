"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransaction = createTransaction;
exports.listTransactions = listTransactions;
exports.getTransactionById = getTransactionById;
exports.updateTransaction = updateTransaction;
exports.deleteTransaction = deleteTransaction;
const prisma_1 = require("../lib/prisma");
async function createTransaction(userId, input) {
    const { tagIds, ...data } = input;
    return prisma_1.prisma.transaction.create({
        data: {
            ...data,
            userId,
            date: new Date(input.date),
            tags: tagIds?.length
                ? { create: tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })) }
                : undefined,
        },
        include: {
            category: true,
            account: true,
            tags: { include: { tag: true } },
        },
    });
}
async function listTransactions(input) {
    const { householdId, from, to, type, categoryId, accountId, page, limit } = input;
    const skip = (page - 1) * limit;
    const where = {
        householdId,
        deletedAt: null,
        ...(type && { type }),
        ...(categoryId && { categoryId }),
        ...(accountId && { accountId }),
        ...(from || to
            ? {
                date: {
                    ...(from && { gte: new Date(from) }),
                    ...(to && { lte: new Date(to) }),
                },
            }
            : {}),
    };
    const [transactions, total] = await prisma_1.prisma.$transaction([
        prisma_1.prisma.transaction.findMany({
            where,
            include: {
                category: true,
                account: true,
                tags: { include: { tag: true } },
            },
            orderBy: { date: "desc" },
            skip,
            take: limit,
        }),
        prisma_1.prisma.transaction.count({ where }),
    ]);
    return {
        data: transactions,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
}
async function getTransactionById(id) {
    return prisma_1.prisma.transaction.findUnique({
        where: { id },
        include: {
            category: true,
            account: true,
            tags: { include: { tag: true } },
        },
    });
}
async function updateTransaction(id, input) {
    const { tagIds, ...data } = input;
    return prisma_1.prisma.transaction.update({
        where: { id },
        data: {
            ...data,
            ...(data.date && { date: new Date(data.date) }),
            ...(tagIds && {
                tags: {
                    deleteMany: {},
                    create: tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })),
                },
            }),
        },
        include: {
            category: true,
            account: true,
            tags: { include: { tag: true } },
        },
    });
}
async function deleteTransaction(id) {
    return prisma_1.prisma.transaction.update({
        where: { id },
        data: { deletedAt: new Date() },
    });
}
