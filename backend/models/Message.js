// backend/models/Message.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Message = sequelize.define("Message", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    senderId: { type: DataTypes.INTEGER, allowNull: false },
    receiverId: { type: DataTypes.INTEGER, allowNull: true },
    text: { type: DataTypes.STRING, allowNull: false },
    mediaUrl: { type: DataTypes.STRING, allowNull: true }, // link to image/audio/doc
    mediaType: {
        type: DataTypes.ENUM("image", "audio", "document"),
        allowNull: true
    },
    groupId: {
        type: DataTypes.INTEGER,
        allowNull: true, // null if it's a 1:1 chat
    },

    timestamp: { type: DataTypes.DATE, allowNull: false },
    // ✅ field for message status
    status: {
        type: DataTypes.ENUM("sent", "delivered", "seen"),
        allowNull: false,
        defaultValue: "sent"
    }
});

export default Message;
