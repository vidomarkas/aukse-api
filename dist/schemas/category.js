"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCategorySchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
exports.createCategorySchema = zod_1.z.object({
    householdId: zod_1.z.string().uuid().optional(),
    name: zod_1.z.string().min(1).max(100),
    icon: zod_1.z.string().optional(),
    color: zod_1.z.string().optional(),
    isIncome: zod_1.z.boolean().default(false),
});
exports.updateCategorySchema = exports.createCategorySchema.partial();
