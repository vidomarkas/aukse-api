import { Router } from "express"
import * as transactionsController from "../controllers/transactions"
import { validate } from "../middleware/validate"
import { createTransactionSchema, updateTransactionSchema } from "../schemas/transaction"
import { requireAuth } from "../middleware/auth"

const router = Router()


router.get("/", requireAuth, transactionsController.getAll)
router.post("/", requireAuth, validate(createTransactionSchema), transactionsController.create)
router.get("/:id", requireAuth, transactionsController.getOne)
router.patch("/:id", requireAuth, validate(updateTransactionSchema), transactionsController.update)
router.delete("/:id", requireAuth, transactionsController.remove)

export default router