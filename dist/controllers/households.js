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
exports.getAll = getAll;
exports.getOne = getOne;
exports.update = update;
exports.remove = remove;
exports.getMembers = getMembers;
exports.removeMember = removeMember;
const householdService = __importStar(require("../services/households"));
async function create(req, res) {
    const userId = req.user.id;
    const household = await householdService.createHousehold(userId, req.body);
    res.status(201).json(household);
}
async function getAll(req, res) {
    const userId = req.user.id;
    const households = await householdService.getHouseholdsForUser(userId);
    res.json(households);
}
async function getOne(req, res) {
    const { id } = req.params;
    const household = await householdService.getHouseholdById(id);
    if (!household) {
        res.status(404).json({ error: "Household not found" });
        return;
    }
    res.json(household);
}
async function update(req, res) {
    const { id } = req.params;
    const household = await householdService.updateHousehold(id, req.body);
    res.json(household);
}
async function remove(req, res) {
    const { id } = req.params;
    await householdService.deleteHousehold(id);
    res.status(204).send();
}
async function getMembers(req, res) {
    const { id: householdId } = req.params;
    const members = await householdService.getMembers(householdId);
    res.json({ data: members });
}
async function removeMember(req, res) {
    const { id: householdId, userId: targetUserId } = req.params;
    const requestingUserId = req.user.id;
    try {
        await householdService.removeMember(householdId, targetUserId, requestingUserId);
        res.status(204).send();
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
