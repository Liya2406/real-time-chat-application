// backend/routes/groupRoutes.js
import express from "express";
import Group from "../models/Group.js";
import GroupMember from "../models/GroupMember.js";
import User from "../models/User.js";
import { authenticate } from "../middleware/authMiddleware.js"; // import your middleware

const router = express.Router();

/* =========================
   1️⃣ Create Group
========================= */
router.post("/create", async (req, res) => {
    try {
        const { name, createdBy, members } = req.body; // members: array of userIds including creator

        const group = await Group.create({ name, createdBy });

        // Add members
        const groupMembers = members.map(userId => ({
            groupId: group.id,
            userId,
            role: userId === createdBy ? "admin" : "member"
        }));

        await GroupMember.bulkCreate(groupMembers);

        // Return group + members with user info
        res.status(201).json({
            success: true,
            group
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create group" });
    }
});

/* =========================
   2️⃣ Add Member
========================= */
router.post("/:groupId/add", async (req, res) => {
    try {
        const { groupId } = req.params;
        const { userId } = req.body;

        const existing = await GroupMember.findOne({ where: { groupId, userId } });
        if (existing) return res.status(400).json({ error: "User already in group" });

        await GroupMember.create({ groupId, userId, role: "member" });

        // Return updated member list
        const membersWithInfo = await GroupMember.findAll({
            where: { groupId },
            include: { model: User, attributes: ["id", "username", "avatar"] }
        });

        res.json(membersWithInfo);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to add member" });
    }
});

/* =========================
   3️⃣ Remove Member
========================= */
router.delete("/:groupId/leave", authenticate, async (req, res) => {
    try {
        const userId = req.userId;
        const groupIdNum = parseInt(req.params.groupId, 10); // ✅ convert to number

        console.log("Leaving group:", groupIdNum, "user:", userId); // debug log

        const deleted = await GroupMember.destroy({ where: { groupId: groupIdNum, userId } });
        if (!deleted) return res.status(404).json({ error: "You are not in this group" });

        const membersWithInfo = await GroupMember.findAll({
            where: { groupId: groupIdNum },
            include: { model: User, attributes: ["id", "username", "avatar"] }
        });

        res.json({ message: "You left the group", members: membersWithInfo });
    } catch (err) {
        console.error("Leave group error:", err);
        res.status(500).json({ error: "Failed to leave group" });
    }
});


/* =========================
   4️⃣ Leave Group
========================= */
// Leave group route
router.delete("/:groupId/leave", authenticate, async (req, res) => {
    try {
        const userId = req.userId; // from middleware
        const { groupId } = req.params;

        const deleted = await GroupMember.destroy({ where: { groupId, userId } });
        if (!deleted) return res.status(404).json({ error: "You are not in this group" });

        // Return updated members list
        const membersWithInfo = await GroupMember.findAll({
            where: { groupId },
            include: { model: User, attributes: ["id", "username", "avatar"] }
        });

        res.json({ message: "You left the group", members: membersWithInfo });
    } catch (err) {
        console.error("Leave group error:", err);
        res.status(500).json({ error: "Failed to leave group" });
    }
});
/* =========================
   5️⃣ Get Group Members
========================= */
router.get("/:groupId/members", async (req, res) => {
    try {
        const { groupId } = req.params;
        const membersWithInfo = await GroupMember.findAll({
            where: { groupId },
            include: { model: User, attributes: ["id", "username", "avatar"] }
        });
        res.json(membersWithInfo);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch members" });
    }
});

/* =========================
   6️⃣ Get all groups for a usera
========================= */
router.get("/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const memberships = await GroupMember.findAll({ where: { userId } });
        const groups = await Promise.all(
            memberships.map(async m => await Group.findByPk(m.groupId))
        );

        res.json(groups);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch user groups" });
    }
});

/* =========================
   7️⃣ Alias for frontend: /my/:userId
========================= */
router.get("/my/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const memberships = await GroupMember.findAll({ where: { userId } });
        const groups = await Promise.all(
            memberships.map(async m => await Group.findByPk(m.groupId))
        );

        res.json(groups);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch user groups" });
    }
});

export default router;
