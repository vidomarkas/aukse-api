"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const householdsController = __importStar(require("../controllers/households"));
const invitationController = __importStar(require("../controllers/invitations"));
const validate_1 = require("../middleware/validate");
const household_1 = require("../schemas/household");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get("/", auth_1.requireAuth, householdsController.getAll);
router.post("/", auth_1.requireAuth, (0, validate_1.validate)(household_1.createHouseholdSchema), householdsController.create);
router.get("/:id", auth_1.requireAuth, householdsController.getOne);
router.patch("/:id", auth_1.requireAuth, (0, validate_1.validate)(household_1.updateHouseholdSchema), householdsController.update);
router.delete("/:id", auth_1.requireAuth, householdsController.remove);
// Member management
router.get("/:id/members", auth_1.requireAuth, householdsController.getMembers);
router.delete("/:id/members/:userId", auth_1.requireAuth, householdsController.removeMember);
// Invitations
router.post("/:id/invitations", auth_1.requireAuth, invitationController.create);
router.get("/:id/invitations", auth_1.requireAuth, invitationController.list);
router.delete("/:id/invitations/:invitationId", auth_1.requireAuth, invitationController.cancel);
exports.default = router;
