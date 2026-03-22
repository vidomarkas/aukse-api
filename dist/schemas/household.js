"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InviteSchema = exports.updateHouseholdSchema = exports.createHouseholdSchema = void 0;
const zod_1 = require("zod");
exports.createHouseholdSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
});
exports.updateHouseholdSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
});
exports.InviteSchema = zod_1.z.object({
    email: zod_1.z.string().email().optional(),
});
