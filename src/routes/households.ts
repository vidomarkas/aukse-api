import { Router } from "express"
import * as householdsController from "../controllers/households"
import * as invitationController from "../controllers/invitations"
import { validate } from "../middleware/validate"
import { createHouseholdSchema, updateHouseholdSchema } from "../schemas/household"
import { requireAuth } from "../middleware/auth"

const router = Router()

router.get("/", requireAuth, householdsController.getAll)
router.post("/", requireAuth, validate(createHouseholdSchema), householdsController.create)
router.get("/:id", requireAuth, householdsController.getOne)
router.patch("/:id", requireAuth, validate(updateHouseholdSchema), householdsController.update)
router.delete("/:id", requireAuth, householdsController.remove)

// Member management
router.get("/:id/members", requireAuth, householdsController.getMembers)
router.delete("/:id/members/:userId", requireAuth, householdsController.removeMember)

// Invitations
router.post("/:id/invitations", requireAuth, invitationController.create)
router.get("/:id/invitations", requireAuth, invitationController.list)
router.delete("/:id/invitations/:invitationId", requireAuth, invitationController.cancel)

export default router