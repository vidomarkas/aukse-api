import { Router } from "express"
import * as recurringController from "../controllers/recurring"
import { requireAuth } from "../middleware/auth"
import { validate } from "../middleware/validate"
import { confirmRecurringSchema, createRecurringSchema, updateRecurringSchema } from "../schemas/recurring"

const router = Router()

router.get("/", requireAuth, recurringController.list)
router.get("/upcoming", requireAuth, recurringController.upcoming)
router.post("/", requireAuth, validate(createRecurringSchema), recurringController.create)
router.patch("/:id", requireAuth, validate(updateRecurringSchema), recurringController.update)
router.delete("/:id", requireAuth, recurringController.remove)
router.post("/:id/confirm", requireAuth, validate(confirmRecurringSchema), recurringController.confirm)
router.post("/:id/skip", requireAuth, recurringController.skip)

export default router
