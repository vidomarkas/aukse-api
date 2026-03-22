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
const transactionService = __importStar(require("../services/transactions"));
const transaction_1 = require("../schemas/transaction");
async function create(req, res) {
    const userId = req.user.id;
    const transaction = await transactionService.createTransaction(userId, req.body);
    res.status(201).json(transaction);
}
async function getAll(req, res) {
    const result = transaction_1.listTransactionsSchema.safeParse(req.query);
    if (!result.success) {
        res.status(400).json({
            error: "Validation failed",
            details: result.error.flatten().fieldErrors,
        });
        return;
    }
    const transactions = await transactionService.listTransactions(result.data);
    res.json(transactions);
}
async function getOne(req, res) {
    const { id } = req.params;
    const transaction = await transactionService.getTransactionById(id);
    if (!transaction) {
        res.status(404).json({ error: "Transaction not found" });
        return;
    }
    res.json(transaction);
}
async function update(req, res) {
    const { id } = req.params;
    const transaction = await transactionService.updateTransaction(id, req.body);
    res.json(transaction);
}
async function remove(req, res) {
    const { id } = req.params;
    await transactionService.deleteTransaction(id);
    res.status(204).send();
}
