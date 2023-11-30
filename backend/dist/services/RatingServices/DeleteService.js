"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Rating_1 = __importDefault(require("../../models/Rating"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const DeleteService = async (id, companyId) => {
    const rating = await Rating_1.default.findOne({
        where: { id, companyId }
    });
    if (!rating) {
        throw new AppError_1.default("ERR_NO_RATING_FOUND", 404);
    }
    await rating.destroy();
};
exports.default = DeleteService;
