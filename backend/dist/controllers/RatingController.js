"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = exports.removeAll = exports.remove = exports.update = exports.show = exports.sendRating = exports.store = exports.index = void 0;
const socket_1 = require("../libs/socket");
const AppError_1 = __importDefault(require("../errors/AppError"));
const CreateService_1 = __importDefault(require("../services/RatingServices/CreateService"));
const ListService_1 = __importDefault(require("../services/RatingServices/ListService"));
const UpdateService_1 = __importDefault(require("../services/RatingServices/UpdateService"));
const ShowService_1 = __importDefault(require("../services/RatingServices/ShowService"));
const DeleteService_1 = __importDefault(require("../services/RatingServices/DeleteService"));
const SimpleListService_1 = __importDefault(require("../services/RatingServices/SimpleListService"));
const DeleteAllService_1 = __importDefault(require("../services/RatingServices/DeleteAllService"));
const ShowTicketService_1 = __importDefault(require("../services/TicketServices/ShowTicketService"));
const UpdateTicketService_1 = __importDefault(require("../services/TicketServices/UpdateTicketService"));
const index = async (req, res) => {
    const { pageNumber, searchParam } = req.query;
    const { companyId } = req.user;
    const { ratings, count, hasMore } = await (0, ListService_1.default)({
        searchParam,
        pageNumber,
        companyId
    });
    return res.json({ ratings, count, hasMore });
};
exports.index = index;
const store = async (req, res) => {
    const { name, message, options } = req.body;
    const { companyId } = req.user;
    const rating = await (0, CreateService_1.default)({
        name,
        message,
        options,
        companyId
    });
    const io = (0, socket_1.getIO)();
    io.emit("rating", {
        action: "create",
        rating
    });
    return res.status(200).json(rating);
};
exports.store = store;
const sendRating = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { ratingId } = req.body;
        const { companyId } = req.user;
        const ticketData = await (0, ShowTicketService_1.default)(ticketId, companyId);
        ticketData.status = "closed";
        await (0, UpdateTicketService_1.default)({
            ticketData,
            ticketId,
            companyId,
            ratingId
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }
    catch (error) {
        throw new AppError_1.default(error.message);
    }
    return res.send();
};
exports.sendRating = sendRating;
const show = async (req, res) => {
    const { ratingId } = req.params;
    const { companyId } = req.user;
    const rating = await (0, ShowService_1.default)(ratingId, companyId);
    return res.status(200).json(rating);
};
exports.show = show;
const update = async (req, res) => {
    if (req.user.profile !== "admin") {
        throw new AppError_1.default("ERR_NO_PERMISSION", 403);
    }
    const { ratingId } = req.params;
    const ratingData = req.body;
    const { companyId } = req.user;
    const rating = await (0, UpdateService_1.default)({ ratingData, id: ratingId, companyId });
    const io = (0, socket_1.getIO)();
    io.emit("rating", {
        action: "update",
        rating
    });
    return res.status(200).json(rating);
};
exports.update = update;
const remove = async (req, res) => {
    const { ratingId } = req.params;
    const { companyId } = req.user;
    await (0, DeleteService_1.default)(ratingId, companyId);
    const io = (0, socket_1.getIO)();
    io.emit("rating", {
        action: "delete",
        ratingId
    });
    return res.status(200).json({ message: "Rating deleted" });
};
exports.remove = remove;
const removeAll = async (req, res) => {
    const { companyId } = req.user;
    await (0, DeleteAllService_1.default)(companyId);
    return res.send();
};
exports.removeAll = removeAll;
const list = async (req, res) => {
    const { searchParam } = req.query;
    const { companyId } = req.user;
    const ratings = await (0, SimpleListService_1.default)({ searchParam, companyId });
    return res.json(ratings);
};
exports.list = list;
