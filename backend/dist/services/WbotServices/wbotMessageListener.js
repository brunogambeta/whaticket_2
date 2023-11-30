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
exports.handleMessage = exports.wbotMessageListener = exports.verifyMessage = exports.getQuotedMessageId = exports.getQuotedMessage = exports.getBodyMessage = void 0;
const path_1 = require("path");
const util_1 = require("util");
const fs_1 = require("fs");
const fs_2 = __importDefault(require("fs"));
const Sentry = __importStar(require("@sentry/node"));
const lodash_1 = require("lodash");
// import {
//   downloadContentFromMessage,
//   extractMessageContent,
//   getContentType,
//   GroupMetadata,
//   Contact as ContactBaileys,
//   jidNormalizedUser,
//   MediaType,
//   MessageUpsertType,
//   PresenceData,
//   proto,
//   WAMessage,
//   WAMessageStubType,
//   WAMessageUpdate,
//   WASocket
// } from "@adiwajshing/baileys";
const baileys_1 = require("@whiskeysockets/baileys");
const Contact_1 = __importDefault(require("../../models/Contact"));
const Ticket_1 = __importDefault(require("../../models/Ticket"));
const Message_1 = __importDefault(require("../../models/Message"));
const Setting_1 = __importDefault(require("../../models/Setting"));
const socket_1 = require("../../libs/socket");
const CreateMessageService_1 = __importDefault(require("../MessageServices/CreateMessageService"));
const logger_1 = require("../../utils/logger");
const CreateOrUpdateContactService_1 = __importDefault(require("../ContactServices/CreateOrUpdateContactService"));
const FindOrCreateTicketService_1 = __importDefault(require("../TicketServices/FindOrCreateTicketService"));
const ShowWhatsAppService_1 = __importDefault(require("../WhatsappService/ShowWhatsAppService"));
const Debounce_1 = require("../../helpers/Debounce");
const UpdateTicketService_1 = __importDefault(require("../TicketServices/UpdateTicketService"));
const Mustache_1 = __importDefault(require("../../helpers/Mustache"));
const UserRating_1 = __importDefault(require("../../models/UserRating"));
const SendWhatsAppMessage_1 = __importDefault(require("./SendWhatsAppMessage"));
const moment_1 = __importDefault(require("moment"));
const Queue_1 = __importDefault(require("../../models/Queue"));
const FindOrCreateATicketTrakingService_1 = __importDefault(require("../TicketServices/FindOrCreateATicketTrakingService"));
const VerifyCurrentSchedule_1 = __importDefault(require("../CompanyService/VerifyCurrentSchedule"));
const Campaign_1 = __importDefault(require("../../models/Campaign"));
const CampaignShipping_1 = __importDefault(require("../../models/CampaignShipping"));
const sequelize_1 = require("sequelize");
const queues_1 = require("../../queues");
const User_1 = __importDefault(require("../../models/User"));
const Setting_2 = __importDefault(require("../../models/Setting"));
const ChatBotListener_1 = require("./ChatBotListener");
const MarkDeleteWhatsAppMessage_1 = __importDefault(require("./MarkDeleteWhatsAppMessage"));
const ListUserQueueServices_1 = __importDefault(require("../UserQueueServices/ListUserQueueServices"));
const Rating_1 = __importDefault(require("../../models/Rating"));
const RatingOption_1 = __importDefault(require("../../models/RatingOption"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const ffmpeg_1 = require("@ffmpeg-installer/ffmpeg");
const cache_1 = require("../../libs/cache");
const Whatsapp_1 = __importDefault(require("../../models/Whatsapp"));
var axios = require('axios');
fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_1.path);
const writeFileAsync = (0, util_1.promisify)(fs_1.writeFile);
function removeFile(directory) {
    fs_2.default.unlink(directory, (error) => {
        if (error)
            throw error;
    });
}
const getTimestampMessage = (msgTimestamp) => {
    return msgTimestamp * 1;
};
const multVecardGet = function (param) {
    let output = " ";
    let name = param.split("\n")[2].replace(";;;", "\n").replace('N:', "").replace(";", "").replace(";", " ").replace(";;", " ").replace("\n", "");
    let inicio = param.split("\n")[4].indexOf('=');
    let fim = param.split("\n")[4].indexOf(':');
    let contact = param.split("\n")[4].substring(inicio + 1, fim).replace(";", "");
    let contactSemWhats = param.split("\n")[4].replace("item1.TEL:", "");
    //console.log(contact);
    if (contact != "item1.TEL") {
        output = output + name + ": 📞" + contact + "" + "\n";
    }
    else
        output = output + name + ": 📞" + contactSemWhats + "" + "\n";
    return output;
};
const contactsArrayMessageGet = (msg) => {
    let contactsArray = msg.message?.contactsArrayMessage?.contacts;
    let vcardMulti = contactsArray.map(function (item, indice) {
        return item.vcard;
    });
    let bodymessage = ``;
    vcardMulti.forEach(function (vcard, indice) {
        bodymessage += vcard + "\n\n" + "";
    });
    let contacts = bodymessage.split("BEGIN:");
    contacts.shift();
    let finalContacts = "";
    for (let contact of contacts) {
        finalContacts = finalContacts + multVecardGet(contact);
    }
    return finalContacts;
};
const getTypeMessage = (msg) => {
    const msgType = (0, baileys_1.getContentType)(msg.message);
    if (msg.message?.viewOnceMessageV2) {
        return "viewOnceMessageV2";
    }
    return msgType;
};
const getBodyButton = (msg) => {
    if (msg.key.fromMe && msg.message.buttonsMessage?.contentText) {
        let bodyMessage = `${msg?.message?.buttonsMessage?.contentText}`;
        for (const buton of msg.message?.buttonsMessage?.buttons) {
            bodyMessage += `\n\n${buton.buttonText?.displayText}`;
        }
        return bodyMessage;
    }
    if (msg.key.fromMe && msg?.message?.viewOnceMessage?.message?.listMessage) {
        let bodyMessage = `${msg?.message?.viewOnceMessage?.message?.listMessage?.description}`;
        for (const buton of msg.message?.viewOnceMessage?.message?.listMessage?.sections) {
            for (const rows of buton.rows) {
                bodyMessage += `\n\n${rows.title}`;
            }
        }
        return bodyMessage;
    }
};
const getBodyList = (msg) => {
    if (msg.key.fromMe && msg.message.listMessage?.description) {
        let bodyMessage = `${msg.message.listMessage?.description}`;
        for (const buton of msg.message.listMessage?.sections) {
            for (const rows of buton.rows) {
                bodyMessage += `\n\n${rows.title}`;
            }
        }
        return bodyMessage;
    }
    if (msg.key.fromMe && msg?.message?.viewOnceMessage?.message?.listMessage) {
        let bodyMessage = `${msg?.message?.viewOnceMessage?.message?.listMessage?.description}`;
        for (const buton of msg.message?.viewOnceMessage?.message?.listMessage?.sections) {
            for (const rows of buton.rows) {
                bodyMessage += `\n\n${rows.title}`;
            }
        }
        return bodyMessage;
    }
};
const msgLocation = (image, latitude, longitude) => {
    if (image) {
        var b64 = Buffer.from(image).toString("base64");
        let data = `data:image/png;base64, ${b64} | https://maps.google.com/maps?q=${latitude}%2C${longitude}&z=17&hl=pt-BR|${latitude}, ${longitude} `;
        return data;
    }
};
const getBodyMessage = (msg) => {
    try {
        let type = getTypeMessage(msg);
        const types = {
            conversation: msg.message?.conversation,
            imageMessage: msg.message?.imageMessage?.caption,
            videoMessage: msg.message?.videoMessage?.caption,
            extendedTextMessage: msg.message.extendedTextMessage?.text,
            buttonsResponseMessage: msg.message.buttonsResponseMessage?.selectedDisplayText,
            listResponseMessage: msg.message.listResponseMessage?.title || msg.message.listResponseMessage?.singleSelectReply?.selectedRowId,
            templateButtonReplyMessage: msg.message?.templateButtonReplyMessage?.selectedId,
            messageContextInfo: msg.message.buttonsResponseMessage?.selectedButtonId || msg.message.listResponseMessage?.title,
            buttonsMessage: getBodyButton(msg) || msg.message.listResponseMessage?.title,
            stickerMessage: "sticker",
            contactMessage: msg.message?.contactMessage?.vcard,
            contactsArrayMessage: (msg.message?.contactsArrayMessage?.contacts) && contactsArrayMessageGet(msg),
            //locationMessage: `Latitude: ${msg.message.locationMessage?.degreesLatitude} - Longitude: ${msg.message.locationMessage?.degreesLongitude}`,
            locationMessage: msgLocation(msg.message?.locationMessage?.jpegThumbnail, msg.message?.locationMessage?.degreesLatitude, msg.message?.locationMessage?.degreesLongitude),
            liveLocationMessage: `Latitude: ${msg.message.liveLocationMessage?.degreesLatitude} - Longitude: ${msg.message.liveLocationMessage?.degreesLongitude}`,
            documentMessage: msg.message?.documentMessage?.title,
            audioMessage: "Áudio",
            listMessage: getBodyList(msg) || msg.message.listResponseMessage?.title,
            viewOnceMessage: getBodyButton(msg),
            reactionMessage: msg.message.reactionMessage?.text || "reaction",
            senderKeyDistributionMessage: msg?.message?.senderKeyDistributionMessage?.axolotlSenderKeyDistributionMessage,
            documentWithCaptionMessage: msg.message?.documentWithCaptionMessage?.message?.documentMessage?.caption,
            viewOnceMessageV2: msg.message?.viewOnceMessageV2?.message?.imageMessage?.caption
        };
        const objKey = Object.keys(types).find(key => key === type);
        if (!objKey) {
            logger_1.logger.warn(`#### Nao achou o type 152: ${type}
${JSON.stringify(msg)}`);
            Sentry.setExtra("Mensagem", { BodyMsg: msg.message, msg, type });
            Sentry.captureException(new Error("Novo Tipo de Mensagem em getTypeMessage"));
        }
        return types[type];
    }
    catch (error) {
        Sentry.setExtra("Error getTypeMessage", { msg, BodyMsg: msg.message });
        Sentry.captureException(error);
        console.log(error);
    }
};
exports.getBodyMessage = getBodyMessage;
const getQuotedMessage = (msg) => {
    const body = (0, baileys_1.extractMessageContent)(msg.message)[Object.keys(msg?.message).values().next().value];
    if (!body?.contextInfo?.quotedMessage)
        return;
    const quoted = (0, baileys_1.extractMessageContent)(body?.contextInfo?.quotedMessage[Object.keys(body?.contextInfo?.quotedMessage).values().next().value]);
    return quoted;
};
exports.getQuotedMessage = getQuotedMessage;
const getQuotedMessageId = (msg) => {
    const body = (0, baileys_1.extractMessageContent)(msg.message)[Object.keys(msg?.message).values().next().value];
    let reaction = msg?.message?.reactionMessage
        ? msg?.message?.reactionMessage?.key?.id
        : "";
    return reaction ? reaction : body?.contextInfo?.stanzaId;
};
exports.getQuotedMessageId = getQuotedMessageId;
const getMeSocket = (wbot) => {
    return {
        id: (0, baileys_1.jidNormalizedUser)(wbot.user.id),
        name: wbot.user.name
    };
};
const getSenderMessage = (msg, wbot) => {
    const me = getMeSocket(wbot);
    if (msg.key.fromMe)
        return me.id;
    const senderId = msg.participant || msg.key.participant || msg.key.remoteJid || undefined;
    return senderId && (0, baileys_1.jidNormalizedUser)(senderId);
};
const getContactMessage = async (msg, wbot) => {
    const isGroup = msg.key.remoteJid.includes("g.us");
    const rawNumber = msg.key.remoteJid.replace(/\D/g, "");
    return isGroup
        ? {
            id: getSenderMessage(msg, wbot),
            name: msg.pushName
        }
        : {
            id: msg.key.remoteJid,
            name: msg.key.fromMe ? rawNumber : msg.pushName
        };
};
const downloadMedia = async (msg) => {
    const mineType = msg.message?.imageMessage ||
        msg.message?.audioMessage ||
        msg.message?.videoMessage ||
        msg.message?.stickerMessage ||
        msg.message?.documentMessage ||
        msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage ||
        msg.message?.documentWithCaptionMessage?.message?.documentMessage;
    const messageType = msg.message?.documentMessage
        ? "document"
        : mineType.mimetype.split("/")[0].replace("application", "document")
            ? mineType.mimetype
                .split("/")[0]
                .replace("application", "document")
            : mineType.mimetype.split("/")[0];
    let stream;
    let contDownload = 0;
    while (contDownload < 10 && !stream) {
        try {
            stream = await (0, baileys_1.downloadContentFromMessage)(msg.message.audioMessage ||
                msg.message.videoMessage ||
                msg.message.documentMessage ||
                msg.message.imageMessage ||
                msg.message.stickerMessage ||
                msg.message.extendedTextMessage?.contextInfo.quotedMessage.imageMessage ||
                msg.message?.buttonsMessage?.imageMessage ||
                msg.message?.templateMessage?.fourRowTemplate?.imageMessage ||
                msg.message?.templateMessage?.hydratedTemplate?.imageMessage ||
                msg.message?.templateMessage?.hydratedFourRowTemplate?.imageMessage ||
                msg.message?.interactiveMessage?.header?.imageMessage ||
                msg.message?.documentWithCaptionMessage?.message?.documentMessage ||
                msg.message?.viewOnceMessageV2?.message?.imageMessage, messageType);
        }
        catch (error) {
            contDownload++;
            await new Promise(resolve => setTimeout(resolve, 1000 * contDownload * 2));
            logger_1.logger.warn(`>>>> erro ${contDownload} de baixar o arquivo ${msg?.key.id}`);
        }
    }
    let buffer = Buffer.from([]);
    // eslint-disable-next-line no-restricted-syntax
    try {
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
    }
    catch (error) {
        return { data: "error", mimetype: "", filename: "" };
    }
    if (!buffer) {
        Sentry.setExtra("ERR_WAPP_DOWNLOAD_MEDIA", { msg });
        Sentry.captureException(new Error("ERR_WAPP_DOWNLOAD_MEDIA"));
        throw new Error("ERR_WAPP_DOWNLOAD_MEDIA");
    }
    let filename = msg.message?.documentMessage?.fileName || "";
    if (!filename) {
        const ext = mineType.mimetype.split("/")[1].split(";")[0];
        filename = `${new Date().getTime()}.${ext}`;
    }
    const media = {
        data: buffer,
        mimetype: mineType.mimetype,
        filename
    };
    return media;
};
const verifyContact = async (msgContact, wbot, companyId) => {
    let profilePicUrl;
    try {
        profilePicUrl = await wbot.profilePictureUrl(msgContact.id);
    }
    catch (e) {
        Sentry.captureException(e);
        profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
    }
    const contactData = {
        name: msgContact?.name || msgContact.id.replace(/\D/g, ""),
        number: msgContact.id.replace(/\D/g, ""),
        profilePicUrl,
        isGroup: msgContact.id.includes("g.us"),
        companyId
    };
    const contact = (0, CreateOrUpdateContactService_1.default)(contactData);
    return contact;
};
const verifyQuotedMessage = async (msg) => {
    if (!msg)
        return null;
    const quoted = (0, exports.getQuotedMessageId)(msg);
    if (!quoted)
        return null;
    const quotedMsg = await Message_1.default.findOne({
        where: { id: quoted }
    });
    if (!quotedMsg)
        return null;
    return quotedMsg;
};
const verifyMediaMessage = async (msg, ticket, contact) => {
    const io = (0, socket_1.getIO)();
    const quotedMsg = await verifyQuotedMessage(msg);
    const media = await downloadMedia(msg);
    if (!media) {
        throw new Error("ERR_WAPP_DOWNLOAD_MEDIA");
    }
    if (!media.filename) {
        const ext = media.mimetype.split("/")[1].split(";")[0];
        media.filename = `${new Date().getTime()}.${ext}`;
    }
    else {
        let originalFilename = media.filename ? `-${media.filename}` : '';
        media.filename = `${new Date().getTime()}${originalFilename}`;
    }
    try {
        const folder = `public/company${ticket.companyId}`;
        if (!fs_2.default.existsSync(folder)) {
            fs_2.default.mkdirSync(folder);
            fs_2.default.chmodSync(folder, 0o777);
        }
        await writeFileAsync((0, path_1.join)(__dirname, "..", "..", "..", folder, media.filename), media.data, "base64");
    }
    catch (err) {
        Sentry.captureException(err);
        logger_1.logger.error(err);
    }
    const body = (0, exports.getBodyMessage)(msg);
    const messageData = {
        id: msg.key.id,
        ticketId: ticket.id,
        contactId: msg.key.fromMe ? undefined : contact.id,
        body: body ? body : media.filename,
        fromMe: msg.key.fromMe,
        read: msg.key.fromMe,
        mediaUrl: media.filename,
        mediaType: media.mimetype.split("/")[0],
        quotedMsgId: quotedMsg?.id,
        ack: msg.status,
        remoteJid: msg.key.remoteJid,
        participant: msg.key.participant,
        dataJson: JSON.stringify(msg)
    };
    await ticket.update({
        lastMessage: body || media.filename
    });
    const newMessage = await (0, CreateMessageService_1.default)({
        messageData,
        companyId: ticket.companyId
    });
    if (!msg.key.fromMe && ticket.status === "closed") {
        await ticket.update({ status: "pending" });
        await ticket.reload({
            include: [
                { model: Queue_1.default, as: "queue" },
                { model: User_1.default, as: "user" },
                { model: Contact_1.default, as: "contact" }
            ],
        });
        io.to("closed").emit(`company-${ticket.companyId}-ticket`, {
            action: "delete",
            ticket,
            ticketId: ticket.id
        });
        io.to(ticket.status)
            .to(ticket.id.toString())
            .emit(`company-${ticket.companyId}-ticket`, {
            action: "update",
            ticket,
            ticketId: ticket.id
        });
    }
    return newMessage;
};
const verifyMessage = async (msg, ticket, contact) => {
    const io = (0, socket_1.getIO)();
    const quotedMsg = await verifyQuotedMessage(msg);
    const body = (0, exports.getBodyMessage)(msg);
    const messageData = {
        id: msg.key.id,
        ticketId: ticket.id,
        contactId: msg.key.fromMe ? undefined : contact.id,
        body,
        fromMe: msg.key.fromMe,
        mediaType: getTypeMessage(msg),
        read: msg.key.fromMe,
        quotedMsgId: quotedMsg?.id,
        ack: msg.status,
        remoteJid: msg.key.remoteJid,
        participant: msg.key.participant,
        dataJson: JSON.stringify(msg)
    };
    await ticket.update({
        lastMessage: body
    });
    await (0, CreateMessageService_1.default)({ messageData, companyId: ticket.companyId });
    if (!msg.key.fromMe && ticket.status === "closed") {
        await ticket.update({ status: "pending" });
        await ticket.reload({
            include: [
                { model: Queue_1.default, as: "queue" },
                { model: User_1.default, as: "user" },
                { model: Contact_1.default, as: "contact" }
            ]
        });
        io.to("closed").emit(`company-${ticket.companyId}-ticket`, {
            action: "delete",
            ticket,
            ticketId: ticket.id
        });
        io.to(ticket.status)
            .to(ticket.id.toString())
            .emit(`company-${ticket.companyId}-ticket`, {
            action: "update",
            ticket,
            ticketId: ticket.id
        });
    }
};
exports.verifyMessage = verifyMessage;
const isValidMsg = (msg) => {
    if (msg.key.remoteJid === "status@broadcast")
        return false;
    try {
        const msgType = getTypeMessage(msg);
        if (!msgType) {
            return;
        }
        const ifType = msgType === "conversation" ||
            msgType === "extendedTextMessage" ||
            msgType === "audioMessage" ||
            msgType === "videoMessage" ||
            msgType === "imageMessage" ||
            msgType === "documentMessage" ||
            msgType === "stickerMessage" ||
            msgType === "buttonsResponseMessage" ||
            msgType === "buttonsMessage" ||
            msgType === "messageContextInfo" ||
            msgType === "locationMessage" ||
            msgType === "liveLocationMessage" ||
            msgType === "contactMessage" ||
            msgType === "voiceMessage" ||
            msgType === "mediaMessage" ||
            msgType === "contactsArrayMessage" ||
            msgType === "reactionMessage" ||
            msgType === "ephemeralMessage" ||
            msgType === "protocolMessage" ||
            msgType === "listResponseMessage" ||
            msgType === "listMessage" ||
            msgType === "viewOnceMessage" ||
            msgType === "documentWithCaptionMessage" ||
            msgType === "viewOnceMessageV2";
        if (!ifType) {
            logger_1.logger.warn(`#### Nao achou o type em isValidMsg: ${msgType}
${JSON.stringify(msg?.message)}`);
            Sentry.setExtra("Mensagem", { BodyMsg: msg.message, msg, msgType });
            Sentry.captureException(new Error("Novo Tipo de Mensagem em isValidMsg"));
        }
        return !!ifType;
    }
    catch (error) {
        Sentry.setExtra("Error isValidMsg", { msg });
        Sentry.captureException(error);
    }
};
const verifyQueue = async (wbot, msg, ticket, contact) => {
    const { queues, greetingMessage, maxUseBotQueues } = await (0, ShowWhatsAppService_1.default)(wbot.id, ticket.companyId);
    console.log('ticket.amountUsedBotQueues', ticket.amountUsedBotQueues);
    let queuePosition = await Setting_2.default.findOne({
        where: {
            key: "sendQueuePosition",
            companyId: ticket.companyId
        }
    });
    if (queues.length === 1) {
        const sendGreetingMessageOneQueues = await Setting_2.default.findOne({
            where: {
                key: "sendGreetingMessageOneQueues",
                companyId: ticket.companyId
            }
        });
        if (greetingMessage.length > 1 && sendGreetingMessageOneQueues?.value === "enabled") {
            const body = (0, Mustache_1.default)(`${greetingMessage}`, ticket);
            await wbot.sendMessage(`${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
                text: body
            });
        }
        await (0, UpdateTicketService_1.default)({
            ticketData: { queueId: queues[0].id },
            ticketId: ticket.id,
            companyId: ticket.companyId,
            ratingId: undefined
        });
        const count = await Ticket_1.default.findAndCountAll({
            where: {
                userId: null,
                status: "pending",
                companyId: ticket.companyId,
                queueId: queues[0].id,
                isGroup: false
            }
        });
        if (queuePosition?.value === "enabled") {
            // Lógica para enviar posição da fila de atendimento
            const qtd = count.count === 0 ? 1 : count.count;
            const msgFila = `*Asistente Virtual:*\n{{ms}} *{{name}}*, sua posição é: *${qtd}*`;
            const bodyFila = (0, Mustache_1.default)(`${msgFila}`, ticket);
            const debouncedSentMessagePosicao = (0, Debounce_1.debounce)(async () => {
                await wbot.sendMessage(`${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
                    text: bodyFila
                });
            }, 3000, ticket.id);
            debouncedSentMessagePosicao();
        }
        return;
    }
    //se existir um valor e se esse valor for diferente de
    //zero e se o valor for maior ou igual ao valor maximo de uso de filas
    // ele vai entrar no if
    if (maxUseBotQueues && maxUseBotQueues !== 0 && ticket.amountUsedBotQueues >= maxUseBotQueues) {
        // await UpdateTicketService({
        //   ticketData: { queueId: queues[0].id },
        //   ticketId: ticket.id
        // });
        return;
    }
    // REGRA PARA DESABILITAR O BOT PARA ALGUM CONTATO
    if (contact.disableBot) {
        return;
    }
    const selectedOption = msg?.message?.buttonsResponseMessage?.selectedButtonId ||
        msg?.message?.listResponseMessage?.singleSelectReply.selectedRowId ||
        (0, exports.getBodyMessage)(msg);
    const choosenQueue = queues[+selectedOption - 1];
    const buttonActive = await Setting_2.default.findOne({
        where: {
            key: "chatBotType",
            companyId: ticket.companyId
        }
    });
    const typeBot = buttonActive?.value || "text";
    // Serviço p/ escolher consultor aleatório para o ticket, ao selecionar fila.
    let randomUserId;
    if (choosenQueue) {
        try {
            const userQueue = await (0, ListUserQueueServices_1.default)(choosenQueue.id);
            if (userQueue.userId > -1) {
                randomUserId = userQueue.userId;
            }
        }
        catch (error) {
            console.error(error);
        }
    }
    // Ativar ou desativar opção de escolher consultor aleatório.
    let settingsUserRandom = await Setting_2.default.findOne({
        where: {
            key: "userRandom",
            companyId: ticket.companyId
        }
    });
    const botText = async () => {
        console.log('APTXT2');
        if (choosenQueue) {
            // if (settingsUserRandom?.value === "enabled") {
            //   await UpdateTicketService({
            //     ticketData: { queueId: choosenQueue.id, userId: randomUserId },
            //     ticketId: ticket.id,
            //     companyId: ticket.companyId,
            //     ratingId: undefined
            //   });
            // }
            // else {
            await (0, UpdateTicketService_1.default)({
                ticketData: { queueId: choosenQueue.id },
                ticketId: ticket.id,
                companyId: ticket.companyId,
                ratingId: undefined
            });
            // }
            if (choosenQueue.chatbots.length > 0) {
                let options = "";
                choosenQueue.chatbots.forEach((chatbot, index) => {
                    options += `*${index + 1}* - ${chatbot.name}\n`;
                });
                const body = (0, Mustache_1.default)(`${choosenQueue.greetingMessage}\n\n${options}\n*#* Voltar ao menu principal`, ticket);
                const sentMessage = await wbot.sendMessage(`${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
                    text: body
                });
                await (0, exports.verifyMessage)(sentMessage, ticket, contact);
                if (settingsUserRandom?.value === "enabled") {
                    await (0, UpdateTicketService_1.default)({
                        ticketData: { userId: randomUserId },
                        ticketId: ticket.id,
                        companyId: ticket.companyId,
                        ratingId: undefined
                    });
                }
            }
            if (!choosenQueue.chatbots.length && choosenQueue.greetingMessage.length !== 0) {
                const body = (0, Mustache_1.default)(`${choosenQueue.greetingMessage}`, ticket);
                const sentMessage = await wbot.sendMessage(`${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
                    text: body
                });
                await (0, exports.verifyMessage)(sentMessage, ticket, contact);
            }
            const count = await Ticket_1.default.findAndCountAll({
                where: {
                    userId: null,
                    status: "pending",
                    companyId: ticket.companyId,
                    queueId: choosenQueue.id,
                    isGroup: false
                }
            });
            console.log('ticket.queueId2', ticket.queueId);
            console.log('count2', count.count);
            if (queuePosition?.value === "enabled" && !choosenQueue.chatbots.length) {
                // Lógica para enviar posição da fila de atendimento
                const qtd = count.count === 0 ? 1 : count.count;
                const msgFila = `*Asistente Virtual:*\n{{ms}} *{{name}}*, sua posição de atendimento é o :  *${qtd}*`;
                const bodyFila = (0, Mustache_1.default)(`${msgFila}`, ticket);
                const debouncedSentMessagePosicao = (0, Debounce_1.debounce)(async () => {
                    await wbot.sendMessage(`${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
                        text: bodyFila
                    });
                }, 3000, ticket.id);
                debouncedSentMessagePosicao();
            }
        }
        else {
            let options = "";
            queues.forEach((queue, index) => {
                options += `*${index + 1}* - ${queue.name}\n`;
            });
            const body = (0, Mustache_1.default)(`${greetingMessage}\n\n${options}`, ticket);
            const debouncedSentMessage = (0, Debounce_1.debounce)(async () => {
                const sentMessage = await wbot.sendMessage(`${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
                    text: body
                });
                (0, exports.verifyMessage)(sentMessage, ticket, contact);
            }, 1000, ticket.id);
            await (0, UpdateTicketService_1.default)({
                ticketData: { amountUsedBotQueues: ticket.amountUsedBotQueues + 1 },
                ticketId: ticket.id,
                companyId: ticket.companyId,
                ratingId: undefined
            });
            const whatsapp = await Whatsapp_1.default.findByPk(ticket.whatsappId);
            debouncedSentMessage();
        }
    };
    const botButton = async () => {
        if (choosenQueue) {
            // if (settingsUserRandom?.value === "enabled") {
            //   await UpdateTicketService({
            //     ticketData: { queueId: choosenQueue.id, userId: randomUserId },
            //     ticketId: ticket.id,
            //     companyId: ticket.companyId,
            //     ratingId: undefined
            //   });
            // }
            // else {
            await (0, UpdateTicketService_1.default)({
                ticketData: { queueId: choosenQueue.id },
                ticketId: ticket.id,
                companyId: ticket.companyId,
                ratingId: undefined
            });
            // }
            if (choosenQueue.chatbots.length > 0) {
                const buttons = [];
                choosenQueue.chatbots.forEach((queue, index) => {
                    buttons.push({
                        buttonId: `${index + 1}`,
                        buttonText: { displayText: queue.name },
                        type: 1
                    });
                });
                const buttonMessage = {
                    text: (0, Mustache_1.default)(`${choosenQueue.greetingMessage}`, ticket),
                    buttons: buttons,
                    headerType: 4
                };
                const sendMsg = await wbot.sendMessage(`${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, buttonMessage);
                await (0, exports.verifyMessage)(sendMsg, ticket, contact);
            }
            if (!choosenQueue.chatbots.length) {
                const body = (0, Mustache_1.default)(`${choosenQueue.greetingMessage}`, ticket);
                const sentMessage = await wbot.sendMessage(`${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
                    text: body
                });
                await (0, exports.verifyMessage)(sentMessage, ticket, contact);
            }
        }
        else {
            const buttons = [];
            queues.forEach((queue, index) => {
                buttons.push({
                    buttonId: `${index + 1}`,
                    buttonText: { displayText: queue.name },
                    type: 4
                });
            });
            const buttonMessage = {
                text: (0, Mustache_1.default)(`${greetingMessage}`, ticket),
                buttons: buttons,
                headerType: 4
            };
            const sendMsg = await wbot.sendMessage(`${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, buttonMessage);
            await (0, exports.verifyMessage)(sendMsg, ticket, contact);
            await (0, UpdateTicketService_1.default)({
                ticketData: { amountUsedBotQueues: ticket.amountUsedBotQueues + 1 },
                ticketId: ticket.id,
                companyId: ticket.companyId,
                ratingId: undefined
            });
        }
    };
    const botList = async () => {
        if (choosenQueue) {
            // if (settingsUserRandom?.value === "enabled") {
            //   await UpdateTicketService({
            //     ticketData: { queueId: choosenQueue.id, userId: randomUserId },
            //     ticketId: ticket.id,
            //     companyId: ticket.companyId,
            //     ratingId: undefined
            //   });
            // }
            // else {
            await (0, UpdateTicketService_1.default)({
                ticketData: { queueId: choosenQueue.id },
                ticketId: ticket.id,
                companyId: ticket.companyId,
                ratingId: undefined
            });
            // }
            if (choosenQueue.chatbots.length > 0) {
                const sectionsRows = [];
                choosenQueue.chatbots.forEach((queue, index) => {
                    sectionsRows.push({
                        title: queue.name,
                        rowId: `${index + 1}`
                    });
                });
                const sections = [
                    {
                        title: "Menu",
                        rows: sectionsRows
                    }
                ];
                const listMessage = {
                    text: (0, Mustache_1.default)(`${choosenQueue.greetingMessage}`, ticket),
                    buttonText: "Escoge una opción",
                    sections
                };
                const sendMsg = await wbot.sendMessage(`${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, listMessage);
                await (0, exports.verifyMessage)(sendMsg, ticket, contact);
            }
            if (!choosenQueue.chatbots.length) {
                const body = (0, Mustache_1.default)(`${choosenQueue.greetingMessage}`, ticket);
                const sentMessage = await wbot.sendMessage(`${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
                    text: body
                });
                await (0, exports.verifyMessage)(sentMessage, ticket, contact);
            }
        }
        else {
            const sectionsRows = [];
            queues.forEach((queue, index) => {
                sectionsRows.push({
                    title: queue.name,
                    rowId: `${index + 1}`
                });
            });
            const sections = [
                {
                    title: "Menu",
                    rows: sectionsRows
                }
            ];
            const listMessage = {
                text: (0, Mustache_1.default)(`${greetingMessage}`, ticket),
                buttonText: "Escoge una opción",
                sections
            };
            const sendMsg = await wbot.sendMessage(`${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, listMessage);
            await (0, exports.verifyMessage)(sendMsg, ticket, contact);
            await (0, UpdateTicketService_1.default)({
                ticketData: { amountUsedBotQueues: ticket.amountUsedBotQueues + 1 },
                ticketId: ticket.id,
                companyId: ticket.companyId,
                ratingId: undefined
            });
        }
    };
    if (typeBot === "text") {
        return botText();
    }
    if (typeBot === "button" && queues.length > 3) {
        return botText();
    }
    if (typeBot === "button" && queues.length <= 3) {
        return botButton();
    }
    if (typeBot === "list") {
        return botList();
    }
};
const verifyRating = (ticketTraking) => {
    if (ticketTraking &&
        ticketTraking.finishedAt === null &&
        ticketTraking.userId !== null &&
        ticketTraking.ratingAt !== null) {
        return true;
    }
    return false;
};
const handleRating = async (msg, ticket, ticketTraking) => {
    const io = (0, socket_1.getIO)();
    let rate = null;
    if (msg.message?.conversation) {
        rate = +msg.message?.conversation;
    }
    if (!(0, lodash_1.isNull)(rate) && ticketTraking.ratingId) {
        const { complationMessage } = await (0, ShowWhatsAppService_1.default)(ticket.whatsappId, ticket.companyId);
        const optionRating = rate;
        const rating = await Rating_1.default.findByPk(ticketTraking.ratingId, {
            include: [
                {
                    model: RatingOption_1.default,
                    as: "options",
                }
            ]
        });
        if (rating) {
            const ratingOptionsSelected = rating.options.filter(option => `${option.value}` === `${optionRating}`);
            let sendFarewellWaitingTicket = await Setting_2.default.findOne({
                where: {
                    key: "sendFarewellWaitingTicket",
                    companyId: ticket.companyId
                }
            });
            if (ratingOptionsSelected.length > 0) {
                await UserRating_1.default.create({
                    ticketId: ticketTraking.ticketId,
                    companyId: ticketTraking.companyId,
                    userId: ticketTraking.userId,
                    ratingId: ticketTraking.ratingId,
                    ratingIdOption: ratingOptionsSelected[0].id
                });
                if (!(0, lodash_1.isNil)(complationMessage) && complationMessage !== "") {
                    if ((ticket.status !== 'pending') || (ticket.status === 'pending' && sendFarewellWaitingTicket?.value === 'enabled')) {
                        const body = `\u200e${complationMessage}`;
                        await (0, SendWhatsAppMessage_1.default)({ body, ticket });
                    }
                }
                await ticketTraking.update({
                    finishedAt: (0, moment_1.default)().toDate(),
                    rated: true
                });
                await ticket.update({
                    queueId: null,
                    chatbot: null,
                    queueOptionId: null,
                    userId: null,
                    status: "closed",
                });
                io.to("open").emit(`company-${ticket.companyId}-ticket`, {
                    action: "delete",
                    ticket,
                    ticketId: ticket.id
                });
                io.to(ticket.status)
                    .to(ticket.id.toString())
                    .emit(`company-${ticket.companyId}-ticket`, {
                    action: "update",
                    ticket,
                    ticketId: ticket.id
                });
            }
            else {
                if (!(0, lodash_1.isNil)(complationMessage) && complationMessage !== "") {
                    if ((ticket.status !== 'pending') || (ticket.status === 'pending' && sendFarewellWaitingTicket?.value === 'enabled')) {
                        const body = `\u200e${complationMessage}`;
                        await (0, SendWhatsAppMessage_1.default)({ body, ticket });
                    }
                }
                await ticketTraking.update({
                    finishedAt: (0, moment_1.default)().toDate(),
                    rated: true
                });
                await ticket.update({
                    queueId: null,
                    userId: null,
                    status: "closed",
                    amountUsedBotQueues: 0
                });
                io.to("open").emit(`company-${ticket.companyId}-ticket`, {
                    action: "delete",
                    ticket,
                    ticketId: ticket.id
                });
                io.to(ticket.status)
                    .to(ticket.id.toString())
                    .emit(`company-${ticket.companyId}-ticket`, {
                    action: "update",
                    ticket,
                    ticketId: ticket.id
                });
            }
        }
    }
};
const handleMessage = async (msg, wbot, companyId) => {
    if (!isValidMsg(msg)) {
        return;
    }
    try {
        let msgContact;
        let groupContact;
        const bodyMessage = (0, exports.getBodyMessage)(msg);
        const msgType = getTypeMessage(msg);
        if (msgType === "protocolMessage")
            return; // Tratar isso no futuro para excluir msgs se vor REVOKE
        const hasMedia = msg.message?.audioMessage ||
            msg.message?.imageMessage ||
            msg.message?.videoMessage ||
            msg.message?.documentMessage ||
            msg.message.stickerMessage ||
            msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage ||
            msg.message?.documentWithCaptionMessage?.message?.documentMessage ||
            msg.message?.viewOnceMessageV2?.message?.imageMessage;
        if (msg.key.fromMe) {
            if (!hasMedia &&
                msgType !== "conversation" &&
                msgType !== "extendedTextMessage" &&
                msgType !== "vcard" &&
                msgType !== "reactionMessage" &&
                msgType !== "ephemeralMessage" &&
                msgType !== "protocolMessage" &&
                msgType !== "viewOnceMessage")
                return;
            msgContact = await getContactMessage(msg, wbot);
        }
        else {
            msgContact = await getContactMessage(msg, wbot);
        }
        const isGroup = msg.key.remoteJid?.endsWith("@g.us");
        // IGNORAR MENSAGENS DE GRUPO
        const msgIsGroupBlock = await Setting_1.default.findOne({
            where: { key: "CheckMsgIsGroup", companyId }
        });
        if (msgIsGroupBlock?.value === "enabled" && isGroup)
            return;
        if (isGroup) {
            const grupoMeta = await wbot.groupMetadata(msg.key.remoteJid);
            const msgGroupContact = {
                id: grupoMeta.id,
                name: grupoMeta.subject
            };
            groupContact = await verifyContact(msgGroupContact, wbot, companyId);
        }
        const whatsapp = await (0, ShowWhatsAppService_1.default)(wbot.id, companyId);
        const contact = await verifyContact(msgContact, wbot, companyId);
        let unreadMessages = 0;
        if (msg.key.fromMe) {
            await cache_1.cacheLayer.set(`contacts:${contact.id}:unreads`, "0");
        }
        else {
            const unreads = await cache_1.cacheLayer.get(`contacts:${contact.id}:unreads`);
            unreadMessages = +unreads + 1;
            await cache_1.cacheLayer.set(`contacts:${contact.id}:unreads`, `${unreadMessages}`);
        }
        // contador
        // if (msg.key.fromMe && count?.unreadCount > 0) {
        //   let remoteJid = msg.key.remoteJid;
        //   SendAckBYRemoteJid({ remoteJid, companyId });
        // }
        // CONFIRMAR
        const _ticket = await (0, FindOrCreateTicketService_1.default)(contact, wbot.id, unreadMessages, companyId, groupContact);
        if (unreadMessages === 0 &&
            whatsapp.farewellMessage &&
            (0, Mustache_1.default)(whatsapp.farewellMessage, _ticket) === bodyMessage) {
            return;
        }
        const ticket = await (0, FindOrCreateTicketService_1.default)(contact, wbot.id, unreadMessages, companyId, groupContact);
        const ticketTraking = await (0, FindOrCreateATicketTrakingService_1.default)({
            ticketId: ticket.id,
            companyId,
            whatsappId: whatsapp?.id
        });
        try {
            if (!msg.key.fromMe) {
                /**
                 * Tratamento para avaliação do atendente
                 */
                if (ticketTraking !== null && verifyRating(ticketTraking)) {
                    handleRating(msg, ticket, ticketTraking);
                    return;
                }
            }
        }
        catch (e) {
            Sentry.captureException(e);
            console.log(e);
        }
        if (hasMedia) {
            await verifyMediaMessage(msg, ticket, contact);
        }
        else {
            await (0, exports.verifyMessage)(msg, ticket, contact);
        }
        const currentSchedule = await (0, VerifyCurrentSchedule_1.default)(companyId);
        const scheduleType = await Setting_2.default.findOne({
            where: {
                companyId,
                key: "scheduleType"
            }
        });
        try {
            if (!msg.key.fromMe && scheduleType) {
                /**
                 * Tratamento para envio de mensagem quando a empresa está fora do expediente
                 */
                if (scheduleType.value === "company" &&
                    !(0, lodash_1.isNil)(currentSchedule) &&
                    (!currentSchedule || currentSchedule.inActivity === false)) {
                    if (whatsapp.outOfHoursMessage !== "") {
                        const body = `${whatsapp.outOfHoursMessage}`;
                        const debouncedSentMessage = (0, Debounce_1.debounce)(async () => {
                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
                                text: body
                            });
                        }, 1000, ticket.id);
                        debouncedSentMessage();
                        return;
                    }
                    return;
                }
            }
        }
        catch (e) {
            Sentry.captureException(e);
            console.log(e);
        }
        if (!ticket.queue &&
            !isGroup &&
            !msg.key.fromMe &&
            !ticket.userId &&
            whatsapp.queues.length >= 1) {
            await verifyQueue(wbot, msg, ticket, contact);
        }
        // Verificação se aceita audio do contato
        if (getTypeMessage(msg) === "audioMessage" &&
            !msg.key.fromMe &&
            !isGroup &&
            !contact.acceptAudioMessage) {
            const sentMessage = await wbot.sendMessage(`${contact.number}@c.us`, {
                text: "*Asistente Virtual*:\nInfelizmente, não podemos ouvir ou enviar áudio através deste canal de serviço, envie uma mensagem de *texto*."
            }, {
                quoted: {
                    key: msg.key,
                    message: {
                        extendedTextMessage: msg.message.extendedTextMessage
                    }
                }
            });
            await (0, exports.verifyMessage)(sentMessage, ticket, contact);
        }
        if (ticket.queue && ticket.queueId && !msg.key.fromMe) {
            if (!ticket.user) {
                await (0, ChatBotListener_1.sayChatbot)(ticket.queueId, wbot, ticket, contact, msg);
            }
        }
        await ticket.reload();
        try {
            if (!msg.key.fromMe && scheduleType && ticket.queueId !== null) {
                /**
                 * Tratamento para envio de mensagem quando a fila está fora do expediente
                 */
                const queue = await Queue_1.default.findByPk(ticket.queueId);
                const { schedules } = queue;
                const now = (0, moment_1.default)();
                const weekday = now.format("dddd").toLowerCase();
                let schedule = null;
                if (Array.isArray(schedules) && schedules.length > 0) {
                    schedule = schedules.find(s => s.weekdayEn === weekday &&
                        s.startTime !== "" &&
                        s.startTime !== null &&
                        s.endTime !== "" &&
                        s.endTime !== null);
                }
                if (scheduleType.value === "queue" &&
                    queue.outOfHoursMessage !== null &&
                    queue.outOfHoursMessage !== "" &&
                    !(0, lodash_1.isNil)(schedule)) {
                    const startTime = (0, moment_1.default)(schedule.startTime, "HH:mm");
                    const endTime = (0, moment_1.default)(schedule.endTime, "HH:mm");
                    if (now.isBefore(startTime) || now.isAfter(endTime)) {
                        const body = `${queue.outOfHoursMessage}`;
                        const debouncedSentMessage = (0, Debounce_1.debounce)(async () => {
                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
                                text: body
                            });
                        }, 1000, ticket.id);
                        debouncedSentMessage();
                        return;
                    }
                }
            }
        }
        catch (e) {
            Sentry.captureException(e);
            console.log(e);
        }
    }
    catch (err) {
        Sentry.captureException(err);
        console.log(err);
        logger_1.logger.error(`Error handling whatsapp message: Err: ${err}`);
    }
};
exports.handleMessage = handleMessage;
const handleMsgAck = async (msg, chat) => {
    await new Promise(r => setTimeout(r, 500));
    const io = (0, socket_1.getIO)();
    try {
        const messageToUpdate = await Message_1.default.findByPk(msg.key.id, {
            include: [
                "contact",
                {
                    model: Message_1.default,
                    as: "quotedMsg",
                    include: ["contact"]
                }
            ]
        });
        if (!messageToUpdate)
            return;
        // CRIAR CAMPO DELIVERYAT
        //   if (chat === 3) {
        //     await messageToUpdate.update({
        //         ack: chat,
        //         deliveredAt: moment().format("YYYY-MM-DD HH:mm:ss")
        //     });
        // } else if (chat === 4 || chat === 5) {
        //     if (messageToUpdate.deliveredAt === null) {
        //         await messageToUpdate.update({
        //             ack: chat,
        //             deliveredAt: moment().format("YYYY-MM-DD HH:mm:ss"),
        //             readAt: moment().format("YYYY-MM-DD HH:mm:ss")
        //         });
        //     } else {
        //         await messageToUpdate.update({
        //             ack: chat,
        //             readAt: moment().format("YYYY-MM-DD HH:mm:ss")
        //         });
        //     }
        // }
        await messageToUpdate.update({ ack: chat });
        io.to(messageToUpdate.ticketId.toString()).emit(`company-${messageToUpdate.companyId}-appMessage`, {
            action: "update",
            message: messageToUpdate
        });
    }
    catch (err) {
        Sentry.captureException(err);
        logger_1.logger.error(`Error handling message ack. Err: ${err}`);
    }
};
const verifyRecentCampaign = async (message, companyId) => {
    if (!isValidMsg(message)) {
        return;
    }
    if (!message.key.fromMe) {
        const number = message.key.remoteJid.replace(/\D/g, "");
        const campaigns = await Campaign_1.default.findAll({
            where: { companyId, status: "EM_ANDAMENTO", confirmation: true }
        });
        if (campaigns) {
            const ids = campaigns.map(c => c.id);
            const campaignShipping = await CampaignShipping_1.default.findOne({
                where: { campaignId: { [sequelize_1.Op.in]: ids }, number, confirmation: null }
            });
            if (campaignShipping) {
                await campaignShipping.update({
                    confirmedAt: (0, moment_1.default)(),
                    confirmation: true
                });
                await queues_1.campaignQueue.add("DispatchCampaign", {
                    campaignShippingId: campaignShipping.id,
                    campaignId: campaignShipping.campaignId
                }, {
                    delay: (0, queues_1.parseToMilliseconds)((0, queues_1.randomValue)(0, 10))
                });
            }
        }
    }
};
const verifyCampaignMessageAndCloseTicket = async (message, companyId) => {
    if (!isValidMsg(message)) {
        return;
    }
    const io = (0, socket_1.getIO)();
    const body = (0, exports.getBodyMessage)(message);
    const isCampaign = /\u200c/.test(body);
    if (message.key.fromMe && isCampaign) {
        const messageRecord = await Message_1.default.findOne({
            where: { id: message.key.id, companyId }
        });
        const ticket = await Ticket_1.default.findByPk(messageRecord.ticketId);
        await ticket.update({ status: "closed", amountUsedBotQueues: 0 });
        io.to("open").emit(`company-${ticket.companyId}-ticket`, {
            action: "delete",
            ticket,
            ticketId: ticket.id
        });
        io.to(ticket.status)
            .to(ticket.id.toString())
            .emit(`company-${ticket.companyId}-ticket`, {
            action: "update",
            ticket,
            ticketId: ticket.id
        });
    }
};
const filterMessages = (msg) => {
    if (msg.message?.protocolMessage)
        return false;
    if ([
        baileys_1.WAMessageStubType.REVOKE,
        baileys_1.WAMessageStubType.E2E_DEVICE_CHANGED,
        baileys_1.WAMessageStubType.E2E_IDENTITY_CHANGED,
        baileys_1.WAMessageStubType.CIPHERTEXT
    ].includes(msg.messageStubType))
        return false;
    return true;
};
const wbotMessageListener = (wbot, companyId) => {
    wbot.ev.on("messages.upsert", async (messageUpsert) => {
        const messages = messageUpsert.messages
            .filter(filterMessages)
            .map(msg => msg);
        if (!messages)
            return;
        messages.forEach(async (message) => {
            const messageExists = await Message_1.default.count({
                where: { id: message.key.id, companyId }
            });
            if (!messageExists) {
                await handleMessage(message, wbot, companyId);
                await verifyRecentCampaign(message, companyId);
                await verifyCampaignMessageAndCloseTicket(message, companyId);
            }
        });
    });
    wbot.ev.on("messages.update", (messageUpdate) => {
        if (messageUpdate.length === 0)
            return;
        messageUpdate.forEach(async (message) => {
            wbot.readMessages([message.key]);
            const msgUp = { ...messageUpdate };
            if (msgUp['0']?.update.messageStubType === 1 && msgUp['0']?.key.remoteJid !== 'status@broadcast') {
                (0, MarkDeleteWhatsAppMessage_1.default)(msgUp['0']?.key.remoteJid, null, msgUp['0']?.key.id, companyId);
            }
            handleMsgAck(message, message.update.status);
        });
    });
    wbot.ev.on("groups.update", (groupUpdate) => {
        if (groupUpdate.length === 0)
            return;
        groupUpdate.forEach(async (group) => {
            const number = group.id.replace(/\D/g, "");
            const nameGroup = group.subject || number;
            const contactData = {
                name: nameGroup,
                number: number,
                isGroup: true,
                companyId: companyId
            };
            const contact = await (0, CreateOrUpdateContactService_1.default)(contactData);
        });
    });
};
exports.wbotMessageListener = wbotMessageListener;
