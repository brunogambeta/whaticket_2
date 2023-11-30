"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => {
        return queryInterface.addColumn("UserRatings", "ratingId", {
            type: sequelize_1.DataTypes.INTEGER,
            references: { model: "Ratings", key: "id" },
            onUpdate: "RESTRICT",
            onDelete: "RESTRICT",
            allowNull: true
        });
    },
    down: (queryInterface) => {
        return queryInterface.removeColumn("UserRatings", "ratingId");
    }
};
