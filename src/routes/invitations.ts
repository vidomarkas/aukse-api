import { Router } from "express"
import { requireAuth } from "../middleware/auth"
import * as invitationController from "../controllers/invitations"

const router = Router()

router.get("/:token", invitationController.getByToken) // public — no auth needed to preview invite
router.post("/:token/accept", requireAuth, invitationController.accept)

export default router
