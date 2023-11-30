"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_1 = require("../libs/socket");
const Message_1 = __importDefault(require("../models/Message"));
const logger_1 = require("../utils/logger");
const GetTicketWbot_1 = __importDefault(require("./GetTicketWbot"));
const SetTicketMessagesAsRead = async (ticket) => {
    await ticket.update({ unreadMessages: 0 });
    if (ticket.channel === 'whatsapp') {
        try {
            const wbot = await (0, GetTicketWbot_1.default)(ticket);
            // no baileys temos que marcar cada mensagem como lida
            // não o chat inteiro como é feito no legacy
            const getJsonMessage = await Message_1.default.findAll({
                where: {
                    ticketId: ticket.id,
                    fromMe: false,
                    read: false
                },
                order: [["createdAt", "DESC"]]
            });
            if (getJsonMessage.length > 0) {
                getJsonMessage.forEach(async (message) => {
                    const msg = JSON.parse(message.dataJson);
                    if (msg.key && msg.key.fromMe === false) {
                        await wbot.readMessages([msg.key]);
                    }
                });
            }
            await Message_1.default.update({ read: true }, {
                where: {
                    ticketId: ticket.id,
                    read: false
                }
            });
        }
        catch (err) {
            console.log(err);
            logger_1.logger.warn(`Could not mark messages as read. Maybe whatsapp session disconnected? Err: ${err}`);
        }
    }
    const io = (0, socket_1.getIO)();
    io.to(ticket.status).to("notification").emit(`company-${ticket.companyId}-ticket`, {
        action: "updateUnread",
        ticketId: ticket.id
    });
};
exports.default = SetTicketMessagesAsRead;
