"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Rating_1 = __importDefault(require("../../models/Rating"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const RatingOption_1 = __importDefault(require("../../models/RatingOption"));
const RatingService = async (id, companyId) => {
    const rating = await Rating_1.default.findOne({
        where: { id, companyId },
        attributes: ["id", "name", "message", "companyId"],
        include: [
            "options",
            {
                model: RatingOption_1.default,
                as: "options",
                attributes: ["id", "name", "value"]
            }
        ]
    });
    if (!rating) {
        throw new AppError_1.default("ERR_NO_RATING_FOUND", 404);
    }
    return rating;
};
exports.default = RatingService;
