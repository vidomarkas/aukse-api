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
const categoryService = __importStar(require("../services/categories"));
async function create(req, res) {
    const category = await categoryService.createCategory(req.body);
    res.status(201).json(category);
}
async function getAll(req, res) {
    const { householdId } = req.query;
    if (!householdId) {
        res.status(400).json({ error: "householdId is required" });
        return;
    }
    const categories = await categoryService.getCategoriesForHousehold(householdId);
    res.json(categories);
}
async function getOne(req, res) {
    const { id } = req.params;
    const category = await categoryService.getCategoryById(id);
    if (!category) {
        res.status(404).json({ error: "Category not found" });
        return;
    }
    res.json(category);
}
async function update(req, res) {
    const { id } = req.params;
    const category = await categoryService.updateCategory(id, req.body);
    res.json(category);
}
async function remove(req, res) {
    const { id } = req.params;
    await categoryService.deleteCategory(id);
    res.status(204).send();
}
