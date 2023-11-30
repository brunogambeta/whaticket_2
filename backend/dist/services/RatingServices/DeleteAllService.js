"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Rating_1 = __importDefault(require("../../models/Rating"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const DeleteAllService = async (companyId) => {
    await Rating_1.default.findAll({
        where: { companyId }
    });
    if (!Rating_1.default) {
        throw new AppError_1.default("ERR_NO_RATING_FOUND", 404);
    }
    await Rating_1.default.destroy({ where: {} });
};
exports.default = DeleteAllService;
