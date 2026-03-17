import { Request, Response, NextFunction } from "express"
import { getAuth, clerkClient } from "@clerk/express"
import { prisma } from "../lib/prisma"

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const { userId } = getAuth(req)
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }

  // Ensure the user exists in our DB. The Clerk webhook handles this in production,
  // but in local dev the webhook can't reach localhost so we sync on first request.
  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!existing) {
    try {
      const clerkUser = await clerkClient.users.getUser(userId)
      const email = clerkUser.emailAddresses[0]?.emailAddress ?? ""
      const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null
      await prisma.user.create({
        data: { id: userId, email, name, avatarUrl: clerkUser.imageUrl },
      })
    } catch (err) {
      console.error("Failed to sync user from Clerk:", err)
      res.status(500).json({ error: "Failed to sync user" })
      return
    }
  }

  req.user = { id: userId, email: "" }
  next()
}