"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCategory = createCategory;
exports.getCategoriesForHousehold = getCategoriesForHousehold;
exports.getCategoryById = getCategoryById;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory;
const prisma_1 = require("../lib/prisma");
async function createCategory(input) {
    return prisma_1.prisma.category.create({
        data: input,
    });
}
async function getCategoriesForHousehold(householdId) {
    return prisma_1.prisma.category.findMany({
        where: {
            OR: [
                { householdId }, // household custom categories
                { householdId: null }, // system default categories
            ],
        },
        orderBy: [{ householdId: "asc" }, { name: "asc" }],
    });
}
async function getCategoryById(id) {
    return prisma_1.prisma.category.findUnique({
        where: { id },
    });
}
async function updateCategory(id, input) {
    return prisma_1.prisma.category.update({
        where: { id },
        data: input,
    });
}
async function deleteCategory(id) {
    return prisma_1.prisma.category.delete({
        where: { id },
    });
}
