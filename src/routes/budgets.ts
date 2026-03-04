import { Router } from "express"
import * as budgetsController from "../controllers/budgets"
import { validate } from "../middleware/validate"
import { createBudgetSchema, updateBudgetSchema } from "../schemas/budget"
import { requireAuth } from "../middleware/auth"

const router = Router()

router.get("/",requireAuth, budgetsController.getAll)
router.post("/",requireAuth, validate(createBudgetSchema), budgetsController.create)
router.get("/:id",requireAuth, budgetsController.getOne)
router.get("/:id/spending",requireAuth, budgetsController.getSpending)
router.patch("/:id",requireAuth, validate(updateBudgetSchema), budgetsController.update)
router.delete("/:id",requireAuth, budgetsController.remove)

export default router