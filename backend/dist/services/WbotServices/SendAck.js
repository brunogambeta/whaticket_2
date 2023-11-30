"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendAckBYRemoteJid = exports.SendAckBYticketId = void 0;
const AppError_1 = __importDefault(require("../../errors/AppError"));
const GetTicketWbot_1 = __importDefault(require("../../helpers/GetTicketWbot"));
const Ticket_1 = __importDefault(require("../../models/Ticket"));
const Message_1 = __importDefault(require("../../models/Message"));
const ShowTicketService_1 = __importDefault(require("../TicketServices/ShowTicketService"));
const SendAckBYticketId = async ({ ticketId, companyId }) => {
    const ticket = await (0, ShowTicketService_1.default)(ticketId, companyId);
    let unreadMessages = ticket.unreadMessages;
    //console.log("UnreadMessages: ", ticket);
    if (unreadMessages > 0) {
        //console.log("Existem mensagens não lidas");
        let wbot;
        try {
            wbot = await (0, GetTicketWbot_1.default)(ticket);
            //console.log(wbot);
        }
        catch (error) {
            console.log("não consegui pegar o wbot");
        }
        if (!ticket) {
            throw new AppError_1.default("ERR_NO_TICKET_FOUND", 404);
        }
        const limit = 100;
        const { count, rows: messages } = await Message_1.default.findAndCountAll({
            limit,
            include: [
                "contact",
                {
                    model: Message_1.default,
                    as: "quotedMsg",
                    include: ["contact"]
                },
                {
                    model: Ticket_1.default,
                    where: { contactId: ticket.contactId },
                    required: true
                }
            ],
            order: [["createdAt", "DESC"]]
        });
        messages.forEach(async (message) => {
            if (wbot) {
                const count = wbot.store.chats.get(message.remoteJid);
                wbot.readMessages([message]);
                let remoteJid = message.remoteJid;
                let ticket = message.ticket;
                ticket.update({ unreadMessages: 0 });
                if (remoteJid && count?.unreadCount > 0) {
                    wbot.store.chats.deleteById(remoteJid);
                    wbot.sendPresenceUpdate('available');
                    setTimeout(() => {
                        wbot.sendPresenceUpdate('unavailable');
                    }, 5000);
                }
                try {
                    // const sentMessage = await (wbot as WASocket)!.sendReadReceipt(
                    //     remoteJid,
                    //     null,
                    //     [messageId],
                    // );
                    // return sentMessage;
                    return true;
                }
                catch (err) {
                    throw new AppError_1.default("ERR_SENDING_WAPP_MSG");
                }
            }
        });
        return;
    }
};
exports.SendAckBYticketId = SendAckBYticketId;
const SendAckBYRemoteJid = async ({ remoteJid, companyId }) => {
    const { rows: messages } = await Message_1.default.findAndCountAll({
        limit: 1,
        order: [["createdAt", "DESC"]],
        where: {
            remoteJid: remoteJid, ack: 0, companyId: companyId
        }
    });
    messages.forEach(async (message) => {
        let ticketId = message.ticketId;
        // let companyId = message.companyId;
        // console.log(ticketId);
        (0, exports.SendAckBYticketId)({ ticketId, companyId });
    });
    return;
};
exports.SendAckBYRemoteJid = SendAckBYRemoteJid;
