import express from "express";
import User from "../models/User.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { Op } from "sequelize";

const router = express.Router();

// GET all users except logged-in user
router.get("/", authenticate, async (req, res) => {
    try {
        const users = await User.findAll({
            where: { id: { [Op.ne]: req.userId } },
            attributes: ["id", "username", "avatar", "status"]
        });
        res.json(users);
    } catch (err) {
        console.error("FETCH USERS ERROR 👉", err);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ UPDATE AVATAR
router.put("/update-avatar", authenticate, async (req, res) => {
    try {
        const { avatar } = req.body;

        if (!avatar) {
            return res.status(400).json({ message: "Avatar required" });
        }

        await User.update(
            { avatar },
            { where: { id: req.userId } }
        );

        res.json({ message: "Avatar updated", avatar });
    } catch (err) {
        console.error("UPDATE AVATAR ERROR 👉", err);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
