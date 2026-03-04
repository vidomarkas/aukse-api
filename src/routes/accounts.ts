import { Router } from "express"
import * as accountsController from "../controllers/accounts"
import { validate } from "../middleware/validate"
import { createAccountSchema, updateAccountSchema } from "../schemas/account"
import { requireAuth } from "../middleware/auth"

const router = Router()

router.get("/", requireAuth, accountsController.getAll)
router.post("/", requireAuth, validate(createAccountSchema), accountsController.create)
router.get("/:id", requireAuth, accountsController.getOne)
router.patch("/:id", requireAuth, validate(updateAccountSchema), accountsController.update)
router.delete("/:id", requireAuth, accountsController.remove)

export default router