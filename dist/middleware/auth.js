"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const express_1 = require("@clerk/express");
const prisma_1 = require("../lib/prisma");
async function requireAuth(req, res, next) {
    const { userId } = (0, express_1.getAuth)(req);
    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    // Ensure the user exists in our DB. The Clerk webhook handles this in production,
    // but in local dev the webhook can't reach localhost so we sync on first request.
    const existing = await prisma_1.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!existing) {
        try {
            const clerkUser = await express_1.clerkClient.users.getUser(userId);
            const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
            const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
            await prisma_1.prisma.user.create({
                data: { id: userId, email, name, avatarUrl: clerkUser.imageUrl },
            });
        }
        catch (err) {
            console.error("Failed to sync user from Clerk:", err);
            res.status(500).json({ error: "Failed to sync user" });
            return;
        }
    }
    req.user = { id: userId, email: "" };
    next();
}
