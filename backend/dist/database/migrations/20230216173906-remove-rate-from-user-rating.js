"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => {
        return queryInterface.removeColumn("UserRatings", "rate");
    },
    down: (queryInterface) => {
        return queryInterface.addColumn("UserRatings", "rate", {
            type: sequelize_1.DataTypes.INTEGER,
            defaultValue: 0
        });
    }
};
