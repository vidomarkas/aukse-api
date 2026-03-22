"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_2 = require("@clerk/express");
const errorHandler_1 = require("./middleware/errorHandler");
const routes_1 = __importDefault(require("./routes"));
const webhooks_1 = __importDefault(require("./routes/webhooks"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use("/api/v1/webhooks", webhooks_1.default);
app.use(express_1.default.json());
app.use((0, express_2.clerkMiddleware)());
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
app.use("/api/v1", routes_1.default);
app.use(errorHandler_1.errorHandler);
exports.default = app;
