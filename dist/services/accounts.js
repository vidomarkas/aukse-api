"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAccount = createAccount;
exports.getAccountsForUser = getAccountsForUser;
exports.getAccountById = getAccountById;
exports.updateAccount = updateAccount;
exports.deleteAccount = deleteAccount;
const prisma_1 = require("../lib/prisma");
async function createAccount(userId, input) {
    // if this is set as default, unset other defaults for this user first
    if (input.isDefault) {
        await prisma_1.prisma.account.updateMany({
            where: { userId },
            data: { isDefault: false },
        });
    }
    return prisma_1.prisma.account.create({
        data: { ...input, userId },
    });
}
async function getAccountsForUser(userId) {
    return prisma_1.prisma.account.findMany({
        where: { userId, deletedAt: null },
        orderBy: { isDefault: "desc" },
    });
}
async function getAccountById(id) {
    return prisma_1.prisma.account.findUnique({
        where: { id },
    });
}
async function updateAccount(id, input) {
    return prisma_1.prisma.account.update({
        where: { id },
        data: input,
    });
}
async function deleteAccount(id) {
    // soft delete
    return prisma_1.prisma.account.update({
        where: { id },
        data: { deletedAt: new Date() },
    });
}
