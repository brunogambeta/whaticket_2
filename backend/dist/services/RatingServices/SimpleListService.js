"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const Rating_1 = __importDefault(require("../../models/Rating"));
const ListService = async ({ searchParam, companyId }) => {
    let whereCondition = {};
    if (searchParam) {
        whereCondition = {
            [sequelize_1.Op.or]: [{ name: { [sequelize_1.Op.like]: `%${searchParam}%` } }]
        };
    }
    const ratings = await Rating_1.default.findAll({
        where: { companyId, ...whereCondition },
        order: [["name", "ASC"]],
        attributes: {
            exclude: ["createdAt", "updatedAt"]
        },
        group: ["Rating.id"]
    });
    return ratings;
};
exports.default = ListService;
