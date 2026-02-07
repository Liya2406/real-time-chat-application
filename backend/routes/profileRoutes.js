import express from "express";
import User from "../models/User.js";
import { authenticate } from "../middleware/authMiddleware.js";
import bcrypt from "bcryptjs"; // needed to hash new password
import { Op } from "sequelize";
const router = express.Router();

/**
 * GET logged-in user profile
 */
router.get("/me", authenticate, async (req, res) => {
    try {
        const user = await User.findByPk(req.userId, {
            attributes: { exclude: ["password"] }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (err) {
        console.error("PROFILE FETCH ERROR 👉", err);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * UPDATE user profile
 */
router.put("/update", authenticate, async (req, res) => {
    try {
        const { username, avatar, status, password } = req.body;

        const updateData = { username, avatar, status };

        // If password is provided, hash it
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.password = hashedPassword;
        }

        await User.update(updateData, { where: { id: req.userId } });

        const updatedUser = await User.findByPk(req.userId, {
            attributes: { exclude: ["password"] }
        });

        res.json({ message: "Profile updated successfully", user: updatedUser });
    } catch (err) {
        console.error("PROFILE UPDATE ERROR 👉", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/all", authenticate, async (req, res) => {
    try {
        const users = await User.findAll({
            where: { id: { [Op.ne]: req.userId } }, // exclude logged-in user
            attributes: ["id", "username", "avatar", "status"]
        });
        res.json(users); // ✅ MUST BE AN ARRAY
    } catch (err) {
        console.error("FETCH USERS ERROR 👉", err);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
