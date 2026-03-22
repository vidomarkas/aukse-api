"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHousehold = createHousehold;
exports.getHouseholdById = getHouseholdById;
exports.getHouseholdsForUser = getHouseholdsForUser;
exports.updateHousehold = updateHousehold;
exports.deleteHousehold = deleteHousehold;
exports.getMembers = getMembers;
exports.removeMember = removeMember;
const prisma_1 = require("../lib/prisma");
const HOUSEHOLD_LIMIT = 5;
async function createHousehold(userId, input) {
    const count = await prisma_1.prisma.householdMember.count({ where: { userId } });
    if (count >= HOUSEHOLD_LIMIT)
        throw new Error("Household limit reached");
    return prisma_1.prisma.household.create({
        data: {
            name: input.name,
            createdBy: userId,
            members: {
                create: {
                    userId,
                    role: "owner",
                },
            },
        },
        include: { members: true },
    });
}
async function getHouseholdById(id) {
    return prisma_1.prisma.household.findUnique({
        where: { id },
        include: { members: { include: { user: true } } },
    });
}
async function getHouseholdsForUser(userId) {
    return prisma_1.prisma.household.findMany({
        where: {
            members: { some: { userId } },
        },
        include: { members: true },
    });
}
async function updateHousehold(id, input) {
    return prisma_1.prisma.household.update({
        where: { id },
        data: input,
    });
}
async function deleteHousehold(id) {
    return prisma_1.prisma.household.delete({
        where: { id },
    });
}
async function getMembers(householdId) {
    return prisma_1.prisma.householdMember.findMany({
        where: { householdId },
        include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        orderBy: { joinedAt: "asc" },
    });
}
async function removeMember(householdId, targetUserId, requestingUserId) {
    const requester = await prisma_1.prisma.householdMember.findUnique({
        where: { householdId_userId: { householdId, userId: requestingUserId } },
    });
    if (!requester)
        throw new Error("Not a member of this household");
    // Only owner can remove others; members can only remove themselves
    if (targetUserId !== requestingUserId && requester.role !== "owner") {
        throw new Error("Only the owner can remove other members");
    }
    // Owner cannot leave their own household
    if (targetUserId === requestingUserId && requester.role === "owner") {
        throw new Error("Owner cannot leave the household. Transfer ownership or delete the household.");
    }
    return prisma_1.prisma.householdMember.delete({
        where: { householdId_userId: { householdId, userId: targetUserId } },
    });
}
