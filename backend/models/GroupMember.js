import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./User.js";

const GroupMember = sequelize.define("GroupMember", {
    groupId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM("admin", "member"),
        defaultValue: "member"
    }
}, {
    timestamps: true
});
GroupMember.belongsTo(User, { foreignKey: "userId" });

export default GroupMember;
