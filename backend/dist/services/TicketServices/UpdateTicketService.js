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
const moment_1 = __importDefault(require("moment"));
const Sentry = __importStar(require("@sentry/node"));
const CheckContactOpenTickets_1 = __importDefault(require("../../helpers/CheckContactOpenTickets"));
const SetTicketMessagesAsRead_1 = __importDefault(require("../../helpers/SetTicketMessagesAsRead"));
const socket_1 = require("../../libs/socket");
const Setting_1 = __importDefault(require("../../models/Setting"));
const Queue_1 = __importDefault(require("../../models/Queue"));
const ShowTicketService_1 = __importDefault(require("./ShowTicketService"));
const ShowWhatsAppService_1 = __importDefault(require("../WhatsappService/ShowWhatsAppService"));
const SendWhatsAppMessage_1 = __importDefault(require("../WbotServices/SendWhatsAppMessage"));
const FindOrCreateATicketTrakingService_1 = __importDefault(require("./FindOrCreateATicketTrakingService"));
const GetTicketWbot_1 = __importDefault(require("../../helpers/GetTicketWbot"));
const wbotMessageListener_1 = require("../WbotServices/wbotMessageListener");
const lodash_1 = require("lodash");
const ListSettingsServiceOne_1 = __importDefault(require("../SettingServices/ListSettingsServiceOne"));
const sendFacebookMessage_1 = __importDefault(require("../FacebookServices/sendFacebookMessage"));
const ShowUserService_1 = __importDefault(require("../UserServices/ShowUserService"));
const ShowService_1 = __importDefault(require("../RatingServices/ShowService"));
const User_1 = __importDefault(require("../../models/User"));
const UpdateTicketService = async ({ ticketData, ticketId, companyId, ratingId }) => {
    try {
        const { status } = ticketData;
        let { queueId, userId, sendFarewellMessage, amountUsedBotQueues } = ticketData;
        let isBot = ticketData.isBot || false;
        let queueOptionId = ticketData.queueOptionId || null;
        const io = (0, socket_1.getIO)();
        const setting = await Setting_1.default.findOne({
            where: {
                companyId: companyId,
                key: "userRating"
            }
        });
        let sendFarewellWaitingTicket = await Setting_1.default.findOne({
            where: {
                key: "sendFarewellWaitingTicket",
                companyId: companyId
            }
        });
        const ticket = await (0, ShowTicketService_1.default)(ticketId, companyId);
        const ticketTraking = await (0, FindOrCreateATicketTrakingService_1.default)({
            ticketId,
            companyId,
            whatsappId: ticket.whatsappId,
            ratingId
        });
        if (ticket.channel === "whatsapp") {
            await (0, SetTicketMessagesAsRead_1.default)(ticket);
        }
        const oldStatus = ticket.status;
        const oldUserId = ticket.user?.id;
        const oldQueueId = ticket.queueId;
        if (oldStatus === "closed") {
            await (0, CheckContactOpenTickets_1.default)(ticket.contact.id);
            isBot = false;
            queueOptionId = null;
        }
        if (ticket.channel === "whatsapp") {
            if (status !== undefined && ["closed"].indexOf(status) > -1) {
                const { complationMessage } = await (0, ShowWhatsAppService_1.default)(ticket.whatsappId, companyId);
                if (setting?.value === "enabled" && ratingId && (sendFarewellMessage || sendFarewellMessage === undefined)) {
                    if (ticketTraking.ratingAt == null) {
                        const rating = await (0, ShowService_1.default)(ratingId, companyId);
                        if (rating) {
                            let { message } = rating;
                            message += "\r\n";
                            rating.options.forEach(option => {
                                message += `\n${option.value} - ${option.name}`;
                            });
                            if (ticket.channel === "whatsapp") {
                                const msg = await (0, SendWhatsAppMessage_1.default)({ body: message, ticket });
                                // await verifyMessage(msg, ticket, ticket.contact);
                            }
                            if (["facebook", "instagram"].includes(ticket.channel)) {
                                console.log(`Checking if ${ticket.contact.number} is a valid ${ticket.channel} contact`);
                                await (0, sendFacebookMessage_1.default)({ body: message, ticket });
                            }
                            await ticketTraking.update({
                                ratingAt: (0, moment_1.default)().toDate()
                            });
                            io.to("open")
                                .to(ticketId.toString())
                                .emit(`company-${ticket.companyId}-ticket`, {
                                action: "delete",
                                ticketId: ticket.id
                            });
                            return { ticket, oldStatus, oldUserId };
                        }
                    }
                    ticketTraking.ratingAt = (0, moment_1.default)().toDate();
                    ticketTraking.rated = false;
                }
                if (!(0, lodash_1.isNil)(complationMessage) && complationMessage !== "" && (sendFarewellMessage || sendFarewellMessage === undefined)) {
                    const _userId = ticket.userId || userId;
                    const user = await User_1.default.findByPk(_userId);
                    let body;
                    if ((ticket.status !== 'pending') || (ticket.status === 'pending' && sendFarewellWaitingTicket?.value === 'enabled')) {
                        if (user.farewellMessage) {
                            body = `\u200e${user.farewellMessage}`;
                        }
                        else {
                            body = `\u200e${complationMessage}`;
                        }
                        if (ticket.channel === "whatsapp") {
                            await (0, SendWhatsAppMessage_1.default)({ body, ticket });
                        }
                        if (["facebook", "instagram"].includes(ticket.channel)) {
                            console.log(`Checking if ${ticket.contact.number} is a valid ${ticket.channel} contact`);
                            await (0, sendFacebookMessage_1.default)({ body, ticket });
                        }
                    }
                }
                ticketTraking.finishedAt = (0, moment_1.default)().toDate();
                ticketTraking.whatsappId = ticket.whatsappId;
                ticketTraking.userId = ticket.userId;
                queueId = null;
                userId = null;
            }
        }
        if (queueId !== undefined && queueId !== null) {
            ticketTraking.queuedAt = (0, moment_1.default)().toDate();
        }
        const settingsTransfTicket = await (0, ListSettingsServiceOne_1.default)({ companyId: companyId, key: "sendMsgTransfTicket" });
        if (settingsTransfTicket?.value === "enabled") {
            // Mensagem de transferencia da FILA
            if (oldQueueId !== queueId && oldUserId === userId && !(0, lodash_1.isNil)(oldQueueId) && !(0, lodash_1.isNil)(queueId)) {
                const queue = await Queue_1.default.findByPk(queueId);
                const wbot = await (0, GetTicketWbot_1.default)(ticket);
                const msgtxt = "*Mensagem automática*:\nVocê foi transferido para o departamento *" + queue?.name + "*\n¡Aguarde um momento, que iremos te ajudar!";
                const queueChangedMessage = await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
                    text: msgtxt
                });
                await (0, wbotMessageListener_1.verifyMessage)(queueChangedMessage, ticket, ticket.contact);
            }
            else 
            // Mensagem de transferencia do ATENDENTE
            if (oldUserId !== userId && oldQueueId === queueId && !(0, lodash_1.isNil)(oldUserId) && !(0, lodash_1.isNil)(userId)) {
                const wbot = await (0, GetTicketWbot_1.default)(ticket);
                const nome = await (0, ShowUserService_1.default)(ticketData.userId);
                const msgtxt = "*Mensagem automático*:\nVocê foi transferido ao assistente *" + nome.name + "*\nAguarde um momento, que iremos te ajudar!";
                const queueChangedMessage = await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
                    text: msgtxt
                });
                await (0, wbotMessageListener_1.verifyMessage)(queueChangedMessage, ticket, ticket.contact);
            }
            else 
            // Mensagem de transferencia do ATENDENTE e da FILA
            if (oldUserId !== userId && !(0, lodash_1.isNil)(oldUserId) && !(0, lodash_1.isNil)(userId) && oldQueueId !== queueId && !(0, lodash_1.isNil)(oldQueueId) && !(0, lodash_1.isNil)(queueId)) {
                const wbot = await (0, GetTicketWbot_1.default)(ticket);
                const queue = await Queue_1.default.findByPk(queueId);
                const nome = await (0, ShowUserService_1.default)(ticketData.userId);
                const msgtxt = "*Mensagem automático*:\nVocê foi transferido para departamento *" + queue?.name + "* você será atendido por *" + nome.name + "*\n¡Aguarde um momento, que iremos te ajudar!";
                const queueChangedMessage = await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
                    text: msgtxt
                });
                await (0, wbotMessageListener_1.verifyMessage)(queueChangedMessage, ticket, ticket.contact);
            }
            else if (oldUserId !== undefined && (0, lodash_1.isNil)(userId) && oldQueueId !== queueId && !(0, lodash_1.isNil)(queueId)) {
                const queue = await Queue_1.default.findByPk(queueId);
                const wbot = await (0, GetTicketWbot_1.default)(ticket);
                const msgtxt = "*Mensagem automático*:\nVocê  foi transferido a um departamento *" + queue?.name + "*\nAguarde um momento, que iremos te ajudar!";
                const queueChangedMessage = await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
                    text: msgtxt
                });
                await (0, wbotMessageListener_1.verifyMessage)(queueChangedMessage, ticket, ticket.contact);
            }
        }
        await ticket.update({
            status,
            queueId,
            userId,
            isBot,
            queueOptionId,
            amountUsedBotQueues: status === "closed" ? 0 : amountUsedBotQueues ? amountUsedBotQueues : ticket.amountUsedBotQueues
        });
        await ticket.reload();
        if (status !== undefined && ["pending"].indexOf(status) > -1) {
            ticketTraking.update({
                whatsappId: ticket.whatsappId,
                queuedAt: (0, moment_1.default)().toDate(),
                startedAt: null,
                userId: null
            });
        }
        if (status !== undefined && ["open"].indexOf(status) > -1) {
            ticketTraking.update({
                startedAt: (0, moment_1.default)().toDate(),
                ratingAt: null,
                rated: false,
                whatsappId: ticket.whatsappId,
                userId: ticket.userId
            });
        }
        await ticketTraking.save();
        if (ticket.status !== oldStatus || ticket.user?.id !== oldUserId) {
            io.to(oldStatus).emit(`company-${companyId}-ticket`, {
                action: "delete",
                ticketId: ticket.id
            });
        }
        io.to(ticket.status)
            .to("notification")
            .to(ticketId.toString())
            .emit(`company-${companyId}-ticket`, {
            action: "update",
            ticket
        });
        return { ticket, oldStatus, oldUserId };
    }
    catch (err) {
        Sentry.captureException(err);
    }
};
exports.default = UpdateTicketService;
