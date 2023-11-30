"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const date_fns_1 = require("date-fns");
const sequelize_1 = require("sequelize");
const Ticket_1 = __importDefault(require("../../models/Ticket"));
const ShowTicketService_1 = __importDefault(require("./ShowTicketService"));
const FindOrCreateATicketTrakingService_1 = __importDefault(require("./FindOrCreateATicketTrakingService"));
const ListSettingsServiceOne_1 = __importDefault(require("../SettingServices/ListSettingsServiceOne"));
const FindOrCreateTicketService = async (contact, whatsappId, unreadMessages, companyId, groupContact, channel) => {
    let ticket = await Ticket_1.default.findOne({
        where: {
            status: {
                [sequelize_1.Op.or]: ["open", "pending", "closed"]
            },
            contactId: groupContact ? groupContact.id : contact.id,
            companyId
        },
        order: [["id", "DESC"]]
    });
    if (ticket) {
        await ticket.update({
            unreadMessages,
            whatsappId: whatsappId
        });
    }
    if (!ticket && groupContact) {
        ticket = await Ticket_1.default.findOne({
            where: {
                contactId: groupContact.id
            },
            order: [["updatedAt", "DESC"]]
        });
        if (ticket) {
            await ticket.update({
                status: "pending",
                userId: null,
                unreadMessages,
                whatsappId: whatsappId,
                companyId,
                isBot: true
            });
            await (0, FindOrCreateATicketTrakingService_1.default)({
                ticketId: ticket.id,
                companyId,
                whatsappId: ticket.whatsappId,
                userId: ticket.userId
            });
        }
    }
    const listSettingsService = await (0, ListSettingsServiceOne_1.default)({
        companyId,
        key: "timeCreateNewTicket"
    });
    let timeCreateNewTicket = Number(listSettingsService?.value);
    if (timeCreateNewTicket)
        timeCreateNewTicket = timeCreateNewTicket;
    if (!ticket && !groupContact) {
        if (timeCreateNewTicket !== 0) {
            ticket = await Ticket_1.default.findOne({
                where: {
                    updatedAt: {
                        [sequelize_1.Op.between]: [
                            +(0, date_fns_1.add)(new Date(), {
                                seconds: timeCreateNewTicket
                            }),
                            +new Date()
                        ]
                    },
                    contactId: contact.id,
                    companyId
                },
                order: [["updatedAt", "DESC"]]
            });
        }
        if (ticket) {
            await ticket.update({
                status: "pending",
                userId: null,
                unreadMessages,
                companyId,
                // queueId: timeCreateNewTicket === 0 ? null : ticket.queueId
            });
            await (0, FindOrCreateATicketTrakingService_1.default)({
                ticketId: ticket.id,
                companyId,
                whatsappId: ticket.whatsappId,
                userId: ticket.userId
            });
        }
    }
    if (!ticket) {
        ticket = await Ticket_1.default.create({
            contactId: groupContact ? groupContact.id : contact.id,
            status: "pending",
            isGroup: !!groupContact,
            unreadMessages,
            whatsappId,
            companyId,
            isBot: true,
            channel
        });
        await (0, FindOrCreateATicketTrakingService_1.default)({
            ticketId: ticket.id,
            companyId,
            whatsappId,
            userId: ticket.userId
        });
    }
    ticket = await (0, ShowTicketService_1.default)(ticket.id, companyId);
    return ticket;
};
exports.default = FindOrCreateTicketService;
