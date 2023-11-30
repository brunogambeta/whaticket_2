"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketTaskMoveToQueue = void 0;
const database_1 = __importDefault(require("../../database"));
const Queue_1 = __importDefault(require("../../models/Queue"));
const Ticket_1 = __importDefault(require("../../models/Ticket"));
const socket_1 = require("../../libs/socket");
const WhatsappQueue_1 = __importDefault(require("../../models/WhatsappQueue"));
const TicketTaskMoveToQueue = async () => {
    const io = (0, socket_1.getIO)();
    console.log('Iniciando atualização de tickets sem fila');
    const tickets = await database_1.default.query(`select * from "Tickets" WHERE status = 'pending' and "updatedAt" <= (NOW() - INTERVAL '1 MINUTE') and ("queueId" = 0 or "queueId" is null) and ("userId" = 0 or "userId" is null)`, {
        model: Ticket_1.default,
        mapToModel: true
    });
    for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        const queue = await Queue_1.default.findOne({
            where: {
                companyId: ticket.companyId
            },
            order: [["id", "ASC"]]
        });
        if (queue === null) {
            console.log('Não foi encontrado fila para a empresa: ', ticket.companyId);
            continue;
        }
        const whatsAppQueue = await WhatsappQueue_1.default.findOne({
            where: {
                queueId: queue.id
            }
        });
        const dataToUpdate = {
            status: 'pending',
            queueId: queue?.id,
            chatbot: false,
        };
        if (whatsAppQueue) {
            dataToUpdate.whatsappId = whatsAppQueue.id;
        }
        console.log('Atualizando ticket: ', ticket.id, 'para a fila: ', queue?.id);
        try {
            await Ticket_1.default.update(dataToUpdate, {
                where: {
                    id: ticket.id,
                },
            });
            io.to(ticket.status)
                .to("notification")
                .to(ticket.id.toString())
                .emit(`company-${ticket.companyId}-ticket`, {
                action: "update",
                ticket
            });
            // io.to(ticket.status)
            // .to("notification")
            // .to(ticket.id.toString())
            // .emit(`company-${ticket.companyId}-ticket`, {
            //   action: "update",
            //   ticket
            // });
        }
        catch (error) {
            console.log('TicketTaskMoveToQueue, ticketId: ', ticket.id, error);
        }
    }
    console.log('Atualizado ', tickets.length, 'tickets');
};
exports.TicketTaskMoveToQueue = TicketTaskMoveToQueue;
