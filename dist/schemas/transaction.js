"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTransactionsSchema = exports.updateTransactionSchema = exports.createTransactionSchema = void 0;
const zod_1 = require("zod");
exports.createTransactionSchema = zod_1.z.object({
    householdId: zod_1.z.string().uuid(),
    accountId: zod_1.z.string().uuid().optional(),
    categoryId: zod_1.z.string().uuid().optional(),
    amount: zod_1.z.number().positive(),
    currency: zod_1.z.string().length(3),
    amountBase: zod_1.z.number().positive().optional(),
    exchangeRate: zod_1.z.number().positive().optional(),
    type: zod_1.z.enum(["expense", "income", "transfer"]).default("expense"),
    description: zod_1.z.string().max(255).optional(),
    date: zod_1.z.string().date(),
    notes: zod_1.z.string().optional(),
    receiptUrl: zod_1.z.string().url().optional(),
    tagIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
});
exports.updateTransactionSchema = exports.createTransactionSchema.partial();
exports.listTransactionsSchema = zod_1.z.object({
    householdId: zod_1.z.string().uuid(),
    from: zod_1.z.string().date().optional(),
    to: zod_1.z.string().date().optional(),
    type: zod_1.z.enum(["expense", "income", "transfer"]).optional(),
    categoryId: zod_1.z.string().uuid().optional(),
    accountId: zod_1.z.string().uuid().optional(),
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
});
