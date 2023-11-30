"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Yup = __importStar(require("yup"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const RatingOption_1 = __importDefault(require("../../models/RatingOption"));
const ShowService_1 = __importDefault(require("./ShowService"));
const UpdateService = async ({ ratingData, id, companyId }) => {
    const rating = await (0, ShowService_1.default)(id, companyId);
    const schema = Yup.object().shape({
        name: Yup.string().min(3)
    });
    const { name, message, options } = ratingData;
    try {
        await schema.validate({ name });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }
    catch (err) {
        throw new AppError_1.default(err.message);
    }
    if (options) {
        await Promise.all(options.map(async (info) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            await RatingOption_1.default.upsert({ ...info, ratingId: rating.id });
        }));
        await Promise.all(rating.options.map(async (oldInfo) => {
            const stillExists = options.findIndex(info => info.id === oldInfo.id);
            if (stillExists === -1) {
                await RatingOption_1.default.destroy({ where: { id: oldInfo.id } });
            }
        }));
    }
    await rating.update({
        name,
        message
    });
    await rating.reload({
        attributes: ["id", "name", "message", "companyId"],
        include: ["options"]
    });
    return rating;
};
exports.default = UpdateService;
