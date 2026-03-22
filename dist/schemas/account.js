"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAccountSchema = exports.createAccountSchema = void 0;
const zod_1 = require("zod");
exports.createAccountSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    type: zod_1.z.enum(["bank", "cash", "credit_card", "savings"]),
    currency: zod_1.z.string().length(3),
    balance: zod_1.z.number().default(0),
    isDefault: zod_1.z.boolean().default(false),
    householdId: zod_1.z.string().uuid().optional(),
});
exports.updateAccountSchema = exports.createAccountSchema.partial();
