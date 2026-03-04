import { prisma } from "../lib/prisma"
import { CreateAccountInput, UpdateAccountInput } from "../schemas/account"

export async function createAccount(userId: string, input: CreateAccountInput) {
  // if this is set as default, unset other defaults for this user first
  if (input.isDefault) {
    await prisma.account.updateMany({
      where: { userId },
      data: { isDefault: false },
    })
  }

  return prisma.account.create({
    data: { ...input, userId },
  })
}

export async function getAccountsForUser(userId: string) {
  return prisma.account.findMany({
    where: { userId, deletedAt: null },
    orderBy: { isDefault: "desc" },
  })
}

export async function getAccountById(id: string) {
  return prisma.account.findUnique({
    where: { id },
  })
}

export async function updateAccount(id: string, input: UpdateAccountInput) {
  return prisma.account.update({
    where: { id },
    data: input,
  })
}

export async function deleteAccount(id: string) {
  // soft delete
  return prisma.account.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}