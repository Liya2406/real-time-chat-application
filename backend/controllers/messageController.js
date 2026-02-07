// backend/controllers/messageController.js
import Message from "../models/Message.js"; // make sure you have a Message model
import fs from "fs";

export const sendMessage = async (req, res) => {
    try {
        const { senderId, receiverId, groupId, text } = req.body;

        if (!text && !req.file) {
            return res.status(400).json({ message: "Message cannot be empty" });
        }

        const messageData = {
            senderId,
            receiverId: receiverId || null, // null for group messages
            groupId: groupId || null,       // null for private messages
            text: text || "",
            mediaUrl: req.file ? `/uploads/${req.file.filename}` : null,
            mediaType: req.file ? req.file.mimetype.split("/")[0] : null,
        };

        const message = await Message.create(messageData);
        res.status(201).json(message);
    } catch (err) {
        console.error("Send message error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Fetch messages (group or private)
export const getMessages = async (req, res) => {
    try {
        const { userId1, userId2, groupId } = req.query;

        let messages;
        if (groupId) {
            messages = await Message.findAll({
                where: { groupId },
                order: [["createdAt", "ASC"]],
            });
        } else if (userId1 && userId2) {
            messages = await Message.findAll({
                where: {
                    receiverId: [userId1, userId2],
                    senderId: [userId1, userId2],
                },
                order: [["createdAt", "ASC"]],
            });
        } else {
            return res.status(400).json({ message: "Invalid request" });
        }

        res.json(messages);
    } catch (err) {
        console.error("Get messages error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
