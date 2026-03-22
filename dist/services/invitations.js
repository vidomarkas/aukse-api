"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInvitation = createInvitation;
exports.getInvitation = getInvitation;
exports.acceptInvitation = acceptInvitation;
exports.listInvitations = listInvitations;
exports.cancelInvitation = cancelInvitation;
const prisma_1 = require("../lib/prisma");
const HOUSEHOLD_LIMIT = 5;
const INVITE_EXPIRY_DAYS = 7;
async function createInvitation(householdId, invitedBy, email) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);
    return prisma_1.prisma.invitation.create({
        data: { householdId, invitedBy, email, expiresAt },
        include: {
            household: { select: { name: true } },
            inviter: { select: { name: true, email: true } },
        },
    });
}
async function getInvitation(token) {
    const invitation = await prisma_1.prisma.invitation.findUnique({
        where: { token },
        include: {
            household: { select: { id: true, name: true } },
            inviter: { select: { name: true, email: true } },
        },
    });
    if (!invitation)
        return null;
    // Auto-expire
    if (invitation.status === "pending" && invitation.expiresAt < new Date()) {
        await prisma_1.prisma.invitation.update({ where: { token }, data: { status: "expired" } });
        return { ...invitation, status: "expired" };
    }
    return invitation;
}
async function acceptInvitation(token, userId) {
    const invitation = await prisma_1.prisma.invitation.findUnique({ where: { token } });
    if (!invitation)
        throw new Error("Invitation not found");
    if (invitation.status !== "pending")
        throw new Error("Invitation is no longer valid");
    if (invitation.expiresAt < new Date()) {
        await prisma_1.prisma.invitation.update({ where: { token }, data: { status: "expired" } });
        throw new Error("Invitation has expired");
    }
    // Check household limit
    const householdCount = await prisma_1.prisma.householdMember.count({ where: { userId } });
    if (householdCount >= HOUSEHOLD_LIMIT)
        throw new Error("Household limit reached");
    // Check if already a member
    const existing = await prisma_1.prisma.householdMember.findUnique({
        where: { householdId_userId: { householdId: invitation.householdId, userId } },
    });
    if (existing)
        throw new Error("Already a member of this household");
    // Accept + add member in a transaction
    const [, member] = await prisma_1.prisma.$transaction([
        prisma_1.prisma.invitation.update({ where: { token }, data: { status: "accepted" } }),
        prisma_1.prisma.householdMember.create({
            data: { householdId: invitation.householdId, userId, role: "member" },
        }),
    ]);
    return member;
}
async function listInvitations(householdId) {
    return prisma_1.prisma.invitation.findMany({
        where: { householdId, status: "pending" },
        include: { inviter: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
    });
}
async function cancelInvitation(invitationId, householdId) {
    return prisma_1.prisma.invitation.updateMany({
        where: { id: invitationId, householdId, status: "pending" },
        data: { status: "expired" },
    });
}
