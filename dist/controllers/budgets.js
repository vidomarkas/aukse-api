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
exports.getSpending = getSpending;
exports.update = update;
exports.remove = remove;
const budgetService = __importStar(require("../services/budgets"));
async function create(req, res) {
    const budget = await budgetService.createBudget(req.body);
    res.status(201).json(budget);
}
async function getAll(req, res) {
    const { householdId } = req.query;
    if (!householdId) {
        res.status(400).json({ error: "householdId is required" });
        return;
    }
    const budgets = await budgetService.getBudgetsForHousehold(householdId);
    res.json(budgets);
}
async function getOne(req, res) {
    const { id } = req.params;
    const budget = await budgetService.getBudgetById(id);
    if (!budget) {
        res.status(404).json({ error: "Budget not found" });
        return;
    }
    res.json(budget);
}
async function getSpending(req, res) {
    const { id } = req.params;
    const spending = await budgetService.getBudgetSpending(id);
    if (!spending) {
        res.status(404).json({ error: "Budget not found" });
        return;
    }
    res.json(spending);
}
async function update(req, res) {
    const { id } = req.params;
    const budget = await budgetService.updateBudget(id, req.body);
    res.json(budget);
}
async function remove(req, res) {
    const { id } = req.params;
    await budgetService.deleteBudget(id);
    res.status(204).send();
}
