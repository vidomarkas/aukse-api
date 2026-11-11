import { Request, Response } from "express"
import { clerkClient } from "@clerk/express"
import * as accountService from "../services/account"
import { buildExport } from "../services/export"

/** Everything Aukse stores about the user, as a ZIP download. */
export async function exportData(req: Request, res: Response) {
  const { filename, zip } = await buildExport(req.user!.id)
  res.setHeader("Content-Type", "application/zip")
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
  res.setHeader("Cache-Control", "no-store")
  res.send(Buffer.from(zip))
}

/** What deleting the account would do, to show before the user confirms. */
export async function deletionPreview(req: Request, res: Response) {
  res.json(await accountService.getDeletionPreview(req.user!.id))
}

/**
 * Deletes the account: Aukse data first, then the Clerk login. In that order, a failure never leaves
 * the user locked out while their data still exists, and the request can simply be repeated.
 */
export async function deleteAccount(req: Request, res: Response) {
  const userId = req.user!.id
  const result = await accountService.deleteAccountData(userId)
  try {
    await clerkClient.users.deleteUser(userId)
  } catch (err) {
    const status = (err as { status?: number }).status
    if (status !== 404) {
      // 404 means the login is already gone, which is the goal.
      console.error("Deleting Clerk user failed:", err)
      res.status(502).json({ error: "Your Aukse data was deleted, but removing your login failed. Please try again." })
      return
    }
  }
  res.json(result)
}
