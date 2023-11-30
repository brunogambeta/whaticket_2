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
const Sentry = __importStar(require("@sentry/node"));
const sequelize_1 = require("sequelize");
const Setting_1 = __importDefault(require("../../models/Setting"));
const Ticket_1 = __importDefault(require("../../models/Ticket"));
const Contact_1 = __importDefault(require("../../models/Contact"));
const logger_1 = require("../../utils/logger");
const socket_1 = require("../../libs/socket");
const CreateOrUpdateBaileysService_1 = __importDefault(require("../BaileysServices/CreateOrUpdateBaileysService"));
const CreateMessageService_1 = __importDefault(require("../MessageServices/CreateMessageService"));
const wbotMonitor = async (wbot, whatsapp, companyId) => {
    const io = (0, socket_1.getIO)();
    const sessionName = whatsapp.name;
    try {
        wbot.ws.on("CB:call", async (node) => {
            const content = node.content[0];
            if (content.tag === "offer") {
                const { from, id } = node.attrs;
                console.log(`${from} is calling you with id ${id}`);
            }
            if (content.tag === "terminate") {
                const sendMsgCall = await Setting_1.default.findOne({
                    where: { key: "acceptCallWhatsapp", companyId: companyId }
                });
                if (sendMsgCall?.value === "enabled") {
                    await wbot.sendMessage(node.attrs.from, {
                        text: "*Asistente Virtual:*\nAs chamadas de voz e vídeo estão desativadas para este WhatsApp, envie uma mensagem de texto..\n\nObrigado(a)!"
                    });
                    const number = node.attrs.from.replace(/\D/g, "");
                    const contact = await Contact_1.default.findOne({
                        where: { number, companyId }
                    });
                    const ticket = await Ticket_1.default.findOne({
                        where: {
                            contactId: contact.id,
                            whatsappId: wbot.id,
                            status: { [sequelize_1.Op.or]: ["open", "pending"] },
                            companyId: companyId
                        }
                    });
                    // se não existir o ticket não faz nada.
                    if (!ticket)
                        return;
                    const date = new Date();
                    const hours = date.getHours();
                    const minutes = date.getMinutes();
                    const body = `Chamada de voz/video perdida às ${hours}:${minutes}`;
                    const messageData = {
                        id: content.attrs["call-id"],
                        ticketId: ticket.id,
                        contactId: contact.id,
                        body,
                        fromMe: false,
                        mediaType: "call_log",
                        read: true,
                        quotedMsgId: null,
                        ack: 1
                    };
                    await ticket.update({
                        lastMessage: body
                    });
                    return (0, CreateMessageService_1.default)({ messageData, companyId });
                }
            }
        });
        wbot.ev.on("contacts.upsert", async (contacts) => {
            console.log("upsert", contacts);
            await (0, CreateOrUpdateBaileysService_1.default)({
                whatsappId: whatsapp.id,
                contacts
            });
        });
        // USO FUTURO
        // wbot.ev.on("messages.upsert", async () => {
        //   const showStatus = await Setting.findOne({
        //     where: { key: "showOnline" }
        //   });
        //   if (showStatus.value === "disabled") {
        //     await wbot.sendPresenceUpdate('unavailable');
        //   } else {
        //     await wbot.sendPresenceUpdate('available');
        //   }
        // });
    }
    catch (err) {
        Sentry.captureException(err);
        logger_1.logger.error(err);
    }
};
exports.default = wbotMonitor;
