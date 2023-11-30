"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => {
        return queryInterface.addColumn("Chatbots", "optionType", {
            defaultValue: "text",
            type: sequelize_1.DataTypes.STRING
        });
    },
    down: (queryInterface) => {
        return queryInterface.removeColumn("Chatbots", "optionType");
    }
};
