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
exports.create = create;
exports.list = list;
exports.cancel = cancel;
exports.getByToken = getByToken;
exports.accept = accept;
const invitationService = __importStar(require("../services/invitations"));
// POST /households/:id/invitations
async function create(req, res) {
    const { id: householdId } = req.params;
    const userId = req.user.id;
    const { email } = req.body;
    const invitation = await invitationService.createInvitation(householdId, userId, email);
    res.status(201).json({ data: invitation });
}
// GET /households/:id/invitations
async function list(req, res) {
    const { id: householdId } = req.params;
    const invitations = await invitationService.listInvitations(householdId);
    res.json({ data: invitations });
}
// DELETE /households/:id/invitations/:invitationId
async function cancel(req, res) {
    const { id: householdId, invitationId } = req.params;
    await invitationService.cancelInvitation(invitationId, householdId);
    res.status(204).send();
}
// GET /invitations/:token
async function getByToken(req, res) {
    const { token } = req.params;
    const invitation = await invitationService.getInvitation(token);
    if (!invitation) {
        res.status(404).json({ error: "Invitation not found" });
        return;
    }
    res.json({ data: invitation });
}
// POST /invitations/:token/accept
async function accept(req, res) {
    const { token } = req.params;
    const userId = req.user.id;
    try {
        const member = await invitationService.acceptInvitation(token, userId);
        res.status(201).json({ data: member });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
