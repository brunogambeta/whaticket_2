"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.send = exports.allMe = exports.remove = exports.store = exports.index = void 0;
const AppError_1 = __importDefault(require("../errors/AppError"));
const SetTicketMessagesAsRead_1 = __importDefault(require("../helpers/SetTicketMessagesAsRead"));
const socket_1 = require("../libs/socket");
const Queue_1 = __importDefault(require("../models/Queue"));
const User_1 = __importDefault(require("../models/User"));
const Whatsapp_1 = __importDefault(require("../models/Whatsapp"));
const ListMessagesService_1 = __importDefault(require("../services/MessageServices/ListMessagesService"));
const ShowTicketService_1 = __importDefault(require("../services/TicketServices/ShowTicketService"));
const DeleteWhatsAppMessage_1 = __importDefault(require("../services/WbotServices/DeleteWhatsAppMessage"));
const SendWhatsAppMedia_1 = __importDefault(require("../services/WbotServices/SendWhatsAppMedia"));
const SendWhatsAppMessage_1 = __importDefault(require("../services/WbotServices/SendWhatsAppMessage"));
const sendFacebookMessageMedia_1 = __importDefault(require("../services/FacebookServices/sendFacebookMessageMedia"));
const sendFacebookMessage_1 = __importDefault(require("../services/FacebookServices/sendFacebookMessage"));
const ShowPlanCompanyService_1 = __importDefault(require("../services/CompanyService/ShowPlanCompanyService"));
const ListMessagesServiceAll_1 = __importDefault(require("../services/MessageServices/ListMessagesServiceAll"));
const index = async (req, res) => {
    const { ticketId } = req.params;
    const { pageNumber } = req.query;
    const { companyId, profile } = req.user;
    const queues = [];
    if (profile !== "admin") {
        const user = await User_1.default.findByPk(req.user.id, {
            include: [{ model: Queue_1.default, as: "queues" }]
        });
        user.queues.forEach(queue => {
            queues.push(queue.id);
        });
    }
    const { count, messages, ticket, hasMore } = await (0, ListMessagesService_1.default)({
        pageNumber,
        ticketId,
        companyId,
        queues
    });
    if (ticket.channel === "whatsapp") {
        (0, SetTicketMessagesAsRead_1.default)(ticket);
    }
    return res.json({ count, messages, ticket, hasMore });
};
exports.index = index;
const store = async (req, res) => {
    const { ticketId } = req.params;
    const { body, quotedMsg } = req.body;
    const medias = req.files;
    const { companyId } = req.user;
    const ticket = await (0, ShowTicketService_1.default)(ticketId, companyId);
    if (ticket.channel === "whatsapp") {
        (0, SetTicketMessagesAsRead_1.default)(ticket);
    }
    try {
        if (medias) {
            await Promise.all(medias.map(async (media) => {
                if (ticket.channel === "whatsapp") {
                    await (0, SendWhatsAppMedia_1.default)({ media, ticket });
                }
                if (ticket.channel === "facebook" || ticket.channel === "instagram") {
                    try {
                        await (0, sendFacebookMessageMedia_1.default)({
                            media,
                            ticket
                        });
                    }
                    catch (error) {
                        console.log(error);
                    }
                }
            }));
        }
        else {
            if (ticket.channel === "whatsapp") {
                await (0, SendWhatsAppMessage_1.default)({ body, ticket, quotedMsg });
            }
            if (ticket.channel === "facebook" || ticket.channel === "instagram") {
                await (0, sendFacebookMessage_1.default)({ body, ticket, quotedMsg });
            }
        }
        return res.send();
    }
    catch (error) {
        console.log(error);
        return res.status(400).json({ error: error.message });
    }
};
exports.store = store;
const remove = async (req, res) => {
    const { messageId } = req.params;
    const { companyId } = req.user;
    const message = await (0, DeleteWhatsAppMessage_1.default)(messageId);
    const io = (0, socket_1.getIO)();
    io.to(message.ticketId.toString()).emit(`company-${companyId}-appMessage`, {
        action: "update",
        message
    });
    return res.send();
};
exports.remove = remove;
const allMe = async (req, res) => {
    const dateStart = req.query.dateStart;
    const dateEnd = req.query.dateEnd;
    const fromMe = req.query.fromMe;
    const { companyId } = req.user;
    const { count } = await (0, ListMessagesServiceAll_1.default)({
        companyId,
        fromMe,
        dateStart,
        dateEnd
    });
    return res.json({ count });
};
exports.allMe = allMe;
const send = async (req, res) => {
    const messageData = req.body;
    const medias = req.files;
    try {
        const authHeader = req.headers.authorization;
        const [, token] = authHeader.split(" ");
        const whatsapp = await Whatsapp_1.default.findOne({ where: { token } });
        const companyId = whatsapp.companyId;
        const company = await (0, ShowPlanCompanyService_1.default)(companyId);
        const sendMessageWithExternalApi = company.plan.useExternalApi;
        if (sendMessageWithExternalApi) {
            if (!whatsapp) {
                throw new Error("Não foi possível realizar a operação");
            }
            if (messageData.number === undefined) {
                throw new Error("O número é obrigatório");
            }
            const number = messageData.number;
            const body = messageData.body;
            if (medias) {
                await Promise.all(medias.map(async (media) => {
                    req.app.get("queues").messageQueue.add("SendMessage", {
                        whatsappId: whatsapp.id,
                        data: {
                            number,
                            body: media.originalname.replace('/', '-'),
                            mediaPath: media.path
                        }
                    }, { removeOnComplete: true, attempts: 3 });
                }));
            }
            else {
                req.app.get("queues").messageQueue.add("SendMessage", {
                    whatsappId: whatsapp.id,
                    data: {
                        number,
                        body
                    }
                }, { removeOnComplete: true, attempts: 3 });
            }
            return res.send({ mensagem: "Mensagem enviada!" });
        }
        return res.status(400).json({ error: 'Essa empresa não tem permissão para usar a API Externa. Entre em contato com o Suporte para verificar nossos planos!' });
    }
    catch (err) {
        console.log(err);
        if (Object.keys(err).length === 0) {
            throw new AppError_1.default("Não foi possível enviar a mensagem, tente novamente em alguns instantes");
        }
        else {
            throw new AppError_1.default(err.message);
        }
    }
};
exports.send = send;
