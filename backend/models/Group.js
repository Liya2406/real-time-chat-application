import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Group = sequelize.define("Group", {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    timestamps: true
});

export default Group;
