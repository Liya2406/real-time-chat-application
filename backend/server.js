// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import Message from "./models/Message.js";
import GroupMember from "./models/GroupMember.js";
import groupRoutes from "./routes/groupRoutes.js";
import User from "./models/User.js"; // make sure you have User model


import http from "http";
import { Server } from "socket.io";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const onlineUsers = {}; // { userId: socket.id }
// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/profile", profileRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);
app.use("/uploads", express.static("uploads"));

// Root route
app.get("/", (req, res) => {
    res.send("Backend server is running!");
});

// HTTP server
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Register online user
    socket.on("user_connected", async (userId) => {
        socket.userId = userId; // store userId for disconnect
        onlineUsers[userId] = socket.id;

        // Optional: mark as online in DB
        await User.update({ lastSeen: null }, { where: { id: userId } });

        // Send current online users to this client
        socket.emit("online_users", Object.keys(onlineUsers));

        // Notify others that this user is online
        socket.broadcast.emit("user_online", { userId });

        console.log("User connected (online):", userId);
    });


    // Handle explicit logout
    socket.on("user_logout", async (userId) => {
        delete onlineUsers[userId];

        // Optional: mark lastSeen in DB
        await User.update({ lastSeen: new Date() }, { where: { id: userId } });

        io.emit("online_users", Object.keys(onlineUsers));
        socket.broadcast.emit("user_offline", { userId });

        console.log("User logged out:", userId);
    });

    // Send + save message
    socket.on("send_message", async (data) => {
        try {
            const { senderId, receiverId, groupId, text, mediaUrl, mediaType } = data;

            if (data.id) {
                // already saved → just emit
                if (groupId) {
                    const members = await GroupMember.findAll({ where: { groupId } });
                    members.forEach(member => {
                        if (member.userId !== senderId) {
                            const memberSocket = onlineUsers[member.userId];
                            if (memberSocket) io.to(memberSocket).emit("receive_message", data);
                        }
                    });
                } else if (receiverId) {
                    const receiverSocketId = onlineUsers[receiverId];
                    if (receiverSocketId) io.to(receiverSocketId).emit("receive_message", data);
                }
                return;
            }

            const savedMessage = await Message.create({
                senderId,
                receiverId: receiverId || null,
                groupId: groupId || null,
                text,
                mediaUrl,
                mediaType,
                timestamp: new Date(),
            });

            if (groupId) {
                const members = await GroupMember.findAll({ where: { groupId } });
                members.forEach(member => {
                    if (member.userId !== senderId) {
                        const memberSocket = onlineUsers[member.userId];
                        if (memberSocket) io.to(memberSocket).emit("receive_message", savedMessage);
                    }
                });
            } else if (receiverId) {
                const receiverSocketId = onlineUsers[receiverId];
                if (receiverSocketId) io.to(receiverSocketId).emit("receive_message", savedMessage);
            }

        } catch (err) {
            console.error("Error saving message:", err);
        }
    });

    // Message seen
    socket.on("message_seen", async ({ messageId, senderId }) => {
        try {
            const message = await Message.findByPk(messageId);
            if (!message) return;

            message.status = "seen";
            await message.save();

            const senderSocket = onlineUsers[senderId];
            if (senderSocket) {
                io.to(senderSocket).emit("message_status_update", { messageId, status: "seen" });
            }
        } catch (err) {
            console.error("Seen update error:", err);
        }
    });

    // Handle unexpected disconnect or browser close
    socket.on("disconnect", async () => {
        const userId = socket.userId;
        if (!userId) return;

        delete onlineUsers[userId];

        const lastSeen = new Date();
        await User.update({ lastSeen }, { where: { id: userId } });

        io.emit("online_users", Object.keys(onlineUsers));
        socket.broadcast.emit("user_offline", { userId, lastSeen });

        console.log(`User disconnected: ${userId}`);
    });

});



// Sync models & start server
sequelize.sync({ alter: true })
    .then(() => {
        console.log("📦 Models synced");
        server.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch(err => console.error("❌ Error syncing models:", err));
