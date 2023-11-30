"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AppError_1 = __importDefault(require("../../errors/AppError"));
const Chatbot_1 = __importDefault(require("../../models/Chatbot"));
const Queue_1 = __importDefault(require("../../models/Queue"));
const ShowQueueService = async (queueId, companyId) => {
    const queue = await Queue_1.default.findByPk(queueId, {
        include: ["chatbots"],
        order: [
            [{ model: Chatbot_1.default, as: "chatbots" }, "id", "asc"],
            ["id", "ASC"]
        ]
    });
    if (queue?.companyId !== companyId) {
        throw new AppError_1.default("Não é possível consultar registros de outra empresa");
    }
    if (!queue) {
        throw new AppError_1.default("ERR_QUEUE_NOT_FOUND");
    }
    return queue;
};
exports.default = ShowQueueService;
