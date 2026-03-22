"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBudgetSchema = exports.createBudgetSchema = void 0;
const zod_1 = require("zod");
exports.createBudgetSchema = zod_1.z.object({
    householdId: zod_1.z.string().uuid(),
    categoryId: zod_1.z.string().uuid().optional(),
    amount: zod_1.z.number().positive(),
    currency: zod_1.z.string().length(3),
    period: zod_1.z.enum(["monthly", "yearly"]),
    startDate: zod_1.z.string().date(),
    endDate: zod_1.z.string().date().optional(),
});
exports.updateBudgetSchema = exports.createBudgetSchema.partial();
