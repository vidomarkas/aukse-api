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
const accountService = __importStar(require("../services/accounts"));
async function create(req, res) {
    const userId = req.user.id;
    const account = await accountService.createAccount(userId, req.body);
    res.status(201).json(account);
}
async function getAll(req, res) {
    const userId = req.user.id;
    const accounts = await accountService.getAccountsForUser(userId);
    res.json(accounts);
}
async function getOne(req, res) {
    const { id } = req.params;
    const account = await accountService.getAccountById(id);
    if (!account) {
        res.status(404).json({ error: "Account not found" });
        return;
    }
    res.json(account);
}
async function update(req, res) {
    const { id } = req.params;
    const account = await accountService.updateAccount(id, req.body);
    res.json(account);
}
async function remove(req, res) {
    const { id } = req.params;
    await accountService.deleteAccount(id);
    res.status(204).send();
}
