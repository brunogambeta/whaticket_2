"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => {
        return queryInterface.removeColumn("Whatsapps", "ratingMessage");
    },
    down: (queryInterface) => {
        return queryInterface.addColumn("Whatsapps", "ratingMessage", {
            type: sequelize_1.DataTypes.TEXT
        });
    }
};
