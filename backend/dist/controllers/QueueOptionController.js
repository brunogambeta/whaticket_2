"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove = exports.update = exports.show = exports.store = exports.uploadFile = exports.index = void 0;
const CreateService_1 = __importDefault(require("../services/QueueOptionService/CreateService"));
const ListService_1 = __importDefault(require("../services/QueueOptionService/ListService"));
const UpdateService_1 = __importDefault(require("../services/QueueOptionService/UpdateService"));
const ShowService_1 = __importDefault(require("../services/QueueOptionService/ShowService"));
const DeleteService_1 = __importDefault(require("../services/QueueOptionService/DeleteService"));
const QueueOption_1 = __importDefault(require("../models/QueueOption"));
const fs_1 = __importDefault(require("fs"));
const Chatbot_1 = __importDefault(require("../models/Chatbot"));
const index = async (req, res) => {
    const { queueId, queueOptionId, parentId } = req.query;
    const queueOptions = await (0, ListService_1.default)({ queueId, queueOptionId, parentId });
    return res.json(queueOptions);
};
exports.index = index;
const uploadFile = async (req, res) => {
    const { queueOptionId } = req.params;
    const queueOptionData = req.body;
    const file = req.file;
    const chatbot = await Chatbot_1.default.findByPk(queueOptionId);
    if (!chatbot) {
        throw new Error("chatbot not found");
    }
    const oldFile = chatbot.greetingMessage;
    if (fs_1.default.existsSync(oldFile)) {
        fs_1.default.unlinkSync(oldFile);
    }
    chatbot.greetingMessage = file.filename;
    chatbot.optionType = 'file';
    await chatbot.save();
    return res.status(200).json({ message: "Option Updated" });
};
exports.uploadFile = uploadFile;
const store = async (req, res) => {
    const queueOptionData = req.body;
    const queueOption = await (0, CreateService_1.default)(queueOptionData);
    return res.status(200).json(queueOption);
};
exports.store = store;
const show = async (req, res) => {
    const { queueOptionId } = req.params;
    const queueOption = await (0, ShowService_1.default)(queueOptionId);
    return res.status(200).json(queueOption);
};
exports.show = show;
const update = async (req, res) => {
    const { queueOptionId } = req.params;
    const queueOptionData = req.body;
    const queueOption = await (0, UpdateService_1.default)(queueOptionId, queueOptionData);
    return res.status(200).json(queueOption);
};
exports.update = update;
const remove = async (req, res) => {
    const { queueOptionId } = req.params;
    const queueOption = await QueueOption_1.default.findByPk(queueOptionId);
    if (!queueOption) {
        throw new Error("QueueOption not found");
    }
    const oldFile = queueOption.message;
    if (fs_1.default.existsSync(oldFile)) {
        fs_1.default.unlinkSync(oldFile);
    }
    await (0, DeleteService_1.default)(queueOptionId);
    return res.status(200).json({ message: "Option Delected" });
};
exports.remove = remove;
