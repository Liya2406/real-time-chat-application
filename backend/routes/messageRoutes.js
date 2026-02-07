// backend/routes/messageRoutes.js
import express from "express";
import Message from "../models/Message.js";
import { sendMessage, getMessages } from "../controllers/messageController.js";
import { Op } from "sequelize";
import multer from "multer";

const router = express.Router();


// ----- Configure storage for uploaded files -----
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // folder to save files
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
// ----- GET messages for a group -----
router.get("/group/:groupId", async (req, res) => {
    const { groupId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    try {
        const messages = await Message.findAll({
            where: { groupId },
            order: [["timestamp", "DESC"]],
            limit
        });

        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch group messages" });
    }
});

const upload = multer({ storage });

// ----- GET messages between two users with pagination -----
router.get("/:user1Id/:user2Id", async (req, res) => {
    const { user1Id, user2Id } = req.params;
    const { limit = 20, lastMessageId } = req.query; // default 20 messages

    try {
        const whereClause = {
            [Op.or]: [
                { senderId: user1Id, receiverId: user2Id },
                { senderId: user2Id, receiverId: user1Id }
            ]
        };

        // If lastMessageId exists, get messages older than this ID
        if (lastMessageId) {
            whereClause.id = { [Op.lt]: lastMessageId };
        }

        const messages = await Message.findAll({
            where: whereClause,
            order: [["timestamp", "DESC"]],
            limit: parseInt(limit),
        });

        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});

// ----- POST route to send a message (text + optional media) -----
router.post("/", upload.single("file"), async (req, res) => {
    try {
        console.log("Message payload:", req.body); //
        const { senderId, receiverId, groupId, text } = req.body; // <-- added groupId
        let mediaUrl = null;
        let mediaType = null;

        if (req.file) {
            mediaUrl = `/uploads/${req.file.filename}`;
            const type = req.file.mimetype.split("/")[0];
            mediaType = type === "application" ? "document" : type;
        }

        const message = await Message.create({
            senderId,
            receiverId: groupId ? null : receiverId,
            groupId: groupId ? groupId : null,
            // null if private message
            text,
            mediaUrl,
            mediaType,
            timestamp: new Date(),
        });

        res.status(201).json(message);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to send message" });
    }
});


export default router;
