import { Router } from "express"
import * as householdsController from "../controllers/households"
import { validate } from "../middleware/validate"
import { createHouseholdSchema, updateHouseholdSchema } from "../schemas/household"
import { requireAuth } from "../middleware/auth"

const router = Router()

router.get("/",requireAuth, householdsController.getAll)
router.post("/",requireAuth, validate(createHouseholdSchema), householdsController.create)
router.get("/:id",requireAuth, householdsController.getOne)
router.patch("/:id",requireAuth, validate(updateHouseholdSchema), householdsController.update)
router.delete("/:id",requireAuth, householdsController.remove)

export default router