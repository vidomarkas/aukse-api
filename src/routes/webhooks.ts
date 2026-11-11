import express, { Router, Request, Response } from "express"
import { Webhook } from "svix"
import { prisma } from "../lib/prisma"
import { deleteAccountData } from "../services/account"

const router = Router()

router.post(
  "/clerk",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const secret = process.env.CLERK_WEBHOOK_SECRET!
    const wh = new Webhook(secret)

    let event: any
    try {
      event = wh.verify(req.body, {
        "svix-id": req.headers["svix-id"] as string,
        "svix-timestamp": req.headers["svix-timestamp"] as string,
        "svix-signature": req.headers["svix-signature"] as string,
      })
    } catch (err) {
      console.error("Webhook verification failed:", err)
      res.status(400).json({ error: "Invalid webhook signature" })
      return
    }

    if (event.type === "user.created") {
      const { id, email_addresses, first_name, last_name, image_url } = event.data

       const email = email_addresses?.[0]?.email_address
        if (!email) {
            res.status(400).json({ error: "No email address found" })
            return
        }
      await prisma.user.create({
        data: {
          id,
          email,
          name: [first_name, last_name].filter(Boolean).join(" ") || null,
          avatarUrl: image_url,
        },
      })
    }

    if (event.type === "user.deleted" && event.data?.id) {
      // Backup for deletions made outside Aukse (e.g. in the Clerk dashboard). Same clean-up as
      // "Delete account" in Settings; safe to run again if it already happened.
      await deleteAccountData(event.data.id)
    }

    res.json({ received: true })
  }
)

export default router