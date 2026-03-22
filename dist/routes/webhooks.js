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
const express_1 = __importStar(require("express"));
const svix_1 = require("svix");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
router.post("/clerk", express_1.default.raw({ type: "application/json" }), async (req, res) => {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    const wh = new svix_1.Webhook(secret);
    let event;
    try {
        event = wh.verify(req.body, {
            "svix-id": req.headers["svix-id"],
            "svix-timestamp": req.headers["svix-timestamp"],
            "svix-signature": req.headers["svix-signature"],
        });
    }
    catch (err) {
        console.error("Webhook verification failed:", err);
        res.status(400).json({ error: "Invalid webhook signature" });
        return;
    }
    if (event.type === "user.created") {
        const { id, email_addresses, first_name, last_name, image_url } = event.data;
        const email = email_addresses?.[0]?.email_address;
        if (!email) {
            res.status(400).json({ error: "No email address found" });
            return;
        }
        await prisma_1.prisma.user.create({
            data: {
                id,
                email,
                name: [first_name, last_name].filter(Boolean).join(" ") || null,
                avatarUrl: image_url,
            },
        });
    }
    if (event.type === "user.deleted") {
        await prisma_1.prisma.user.update({
            where: { id: event.data.id },
            data: { deletedAt: new Date() },
        });
    }
    res.json({ received: true });
});
exports.default = router;
