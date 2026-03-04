import { prisma } from "../lib/prisma"
import { CreateTransactionInput, UpdateTransactionInput, ListTransactionsInput } from "../schemas/transaction"

export async function createTransaction(userId: string, input: CreateTransactionInput) {
  const { tagIds, ...data } = input

  return prisma.transaction.create({
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
  })
}

export async function listTransactions(input: ListTransactionsInput) {
  const { householdId, from, to, type, categoryId, accountId, page, limit } = input
  const skip = (page - 1) * limit

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
  }

  const [transactions, total] = await prisma.$transaction([
    prisma.transaction.findMany({
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
    prisma.transaction.count({ where }),
  ])

  return {
    data: transactions,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getTransactionById(id: string) {
  return prisma.transaction.findUnique({
    where: { id },
    include: {
      category: true,
      account: true,
      tags: { include: { tag: true } },
    },
  })
}

export async function updateTransaction(id: string, input: UpdateTransactionInput) {
  const { tagIds, ...data } = input

  return prisma.transaction.update({
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
  })
}

export async function deleteTransaction(id: string) {
  return prisma.transaction.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}