"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClosedAllOpenTickets = void 0;
const Ticket_1 = __importDefault(require("../../models/Ticket"));
const Whatsapp_1 = __importDefault(require("../../models/Whatsapp"));
const socket_1 = require("../../libs/socket");
const logger_1 = require("../../utils/logger");
const ClosedAllOpenTickets = async (companyId) => {
    const io = (0, socket_1.getIO)();
    try {
        const { rows: tickets } = await Ticket_1.default.findAndCountAll({
            where: { status: "open", companyId: companyId },
            order: [["updatedAt", "DESC"]]
        });
        tickets.forEach(async (ticket) => {
            const whatsapp = await Whatsapp_1.default.findByPk(ticket?.whatsappId);
            let horasFecharAutomaticamente = whatsapp?.expiresTicket;
            if (horasFecharAutomaticamente &&
                horasFecharAutomaticamente !== undefined &&
                horasFecharAutomaticamente !== 0 &&
                Number(horasFecharAutomaticamente) > 0) {
                let dataLimite = new Date();
                dataLimite.setHours(dataLimite.getHours() - Number(horasFecharAutomaticamente));
                tickets.forEach(async (ticket) => {
                    if (ticket.status === "open") {
                        let dataUltimaInteracaoChamado = new Date(ticket.updatedAt);
                        if (dataUltimaInteracaoChamado < dataLimite) {
                            console.log(`Fechando ticket ${ticket.id} da company ${ticket.companyId}`);
                            await ticket.update({
                                status: "closed",
                                unreadMessages: 0,
                                userId: null,
                                queueId: null,
                                amountUsedBotQueues: 0
                            });
                            io.to("open").emit(`company-${ticket.companyId}-ticket`, {
                                action: "delete",
                                ticket,
                                ticketId: ticket.id
                            });
                        }
                    }
                });
                logger_1.logger.info(`Fechando tickets em abertos da companyId: ${companyId}`);
            }
        });
    }
    catch (e) {
        console.log('e', e);
    }
};
exports.ClosedAllOpenTickets = ClosedAllOpenTickets;
