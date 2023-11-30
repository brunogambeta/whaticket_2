"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMessage = exports.verifyMessageMedia = exports.verifyMessage = void 0;
const fs_1 = require("fs");
const fs_2 = __importDefault(require("fs"));
const axios_1 = __importDefault(require("axios"));
const path_1 = require("path");
const CreateOrUpdateContactService_1 = __importDefault(require("../ContactServices/CreateOrUpdateContactService"));
const CreateMessageService_1 = __importDefault(require("../MessageServices/CreateMessageService"));
const FindOrCreateTicketService_1 = __importDefault(require("../TicketServices/FindOrCreateTicketService"));
const graphAPI_1 = require("./graphAPI");
const Whatsapp_1 = __importDefault(require("../../models/Whatsapp"));
const UpdateTicketService_1 = __importDefault(require("../TicketServices/UpdateTicketService"));
const Debounce_1 = require("../../helpers/Debounce");
const ShowWhatsAppService_1 = __importDefault(require("../WhatsappService/ShowWhatsAppService"));
const Mustache_1 = __importDefault(require("../../helpers/Mustache"));
const Queue_1 = __importDefault(require("../../models/Queue"));
const Chatbot_1 = __importDefault(require("../../models/Chatbot"));
const Message_1 = __importDefault(require("../../models/Message"));
const ChatbotListenerFacebook_1 = require("../WbotServices/ChatbotListenerFacebook");
const verifyContact = async (msgContact, channel, companyId) => {
    if (!msgContact)
        return null;
    const contactData = {
        name: msgContact?.name || `${msgContact?.first_name} ${msgContact?.last_name}`,
        number: msgContact.id,
        profilePicUrl: "",
        isGroup: false,
        companyId: companyId,
        channel: channel
    };
    const contact = (0, CreateOrUpdateContactService_1.default)(contactData);
    return contact;
};
const verifyMessage = async (msg, body, ticket, contact) => {
    const quotedMsg = await verifyQuotedMessage(msg);
    const messageData = {
        id: msg.mid || msg.message_id,
        ticketId: ticket.id,
        contactId: msg.is_echo ? undefined : contact.id,
        body: msg.text || body,
        fromMe: msg.is_echo,
        read: msg?.is_echo,
        quotedMsgId: quotedMsg?.id,
        ack: 3,
        dataJson: JSON.stringify(msg)
    };
    await (0, CreateMessageService_1.default)({ messageData, companyId: ticket.companyId });
    await ticket.update({
        lastMessage: msg.text
    });
};
exports.verifyMessage = verifyMessage;
const verifyMessageMedia = async (msg, ticket, contact) => {
    const { data } = await axios_1.default.get(msg.attachments[0].payload.url, {
        responseType: "arraybuffer"
    });
    // eslint-disable-next-line no-eval
    const { fileTypeFromBuffer } = await eval('import("file-type")');
    const type = await fileTypeFromBuffer(data);
    const fileName = `${new Date().getTime()}.${type.ext}`;
    const folder = `public/company${ticket.companyId}`;
    if (!fs_2.default.existsSync(folder)) {
        fs_2.default.mkdirSync(folder);
        fs_2.default.chmodSync(folder, 0o777);
    }
    (0, fs_1.writeFileSync)((0, path_1.join)(__dirname, "..", "..", "..", folder, fileName), data, "base64");
    const messageData = {
        id: msg.mid,
        ticketId: ticket.id,
        contactId: msg.is_echo ? undefined : contact.id,
        body: msg.text || fileName,
        fromMe: msg.is_echo,
        mediaType: msg.attachments[0].type,
        mediaUrl: fileName,
        read: msg.is_echo,
        quotedMsgId: null,
        ack: 3,
        dataJson: JSON.stringify(msg),
    };
    await (0, CreateMessageService_1.default)({ messageData, companyId: ticket.companyId });
    await ticket.update({
        lastMessage: msg.text
    });
};
exports.verifyMessageMedia = verifyMessageMedia;
const verifyQuotedMessage = async (msg) => {
    if (!msg)
        return null;
    const quoted = msg?.reply_to?.mid;
    if (!quoted)
        return null;
    const quotedMsg = await Message_1.default.findOne({
        where: { id: quoted }
    });
    if (!quotedMsg)
        return null;
    return quotedMsg;
};
const handleMessage = async (token, webhookEvent, channel, companyId) => {
    try {
        if (webhookEvent.message) {
            let msgContact;
            const senderPsid = webhookEvent.sender.id;
            const recipientPsid = webhookEvent.recipient.id;
            const { message } = webhookEvent;
            const fromMe = message.is_echo;
            if (fromMe) {
                // if (/\u200e/.test(message.text)) return;
                msgContact = await (0, graphAPI_1.profilePsid)(recipientPsid, token.facebookUserToken);
            }
            else {
                msgContact = await (0, graphAPI_1.profilePsid)(senderPsid, token.facebookUserToken);
            }
            const contact = await verifyContact(msgContact, channel, companyId);
            const unreadCount = fromMe ? 0 : 1;
            const getSession = await Whatsapp_1.default.findOne({
                where: {
                    facebookPageUserId: token.facebookPageUserId
                },
                include: [
                    {
                        model: Queue_1.default,
                        as: "queues",
                        attributes: ["id", "name", "color", "greetingMessage"],
                        include: [
                            {
                                model: Chatbot_1.default,
                                as: "chatbots",
                                attributes: ["id", "name", "greetingMessage"]
                            }
                        ]
                    }
                ],
                order: [
                    ["queues", "id", "ASC"],
                    ["queues", "chatbots", "id", "ASC"]
                ]
            });
            // confirmar isso
            const _ticket = await (0, FindOrCreateTicketService_1.default)(contact, getSession.id, unreadCount, 1, contact, channel);
            if (getSession.farewellMessage &&
                (0, Mustache_1.default)(getSession.farewellMessage, _ticket) === message.text)
                return;
            const ticket = await (0, FindOrCreateTicketService_1.default)(contact, getSession.id, unreadCount, companyId, contact, channel);
            await ticket.update({
                lastMessage: message.text
            });
            if (message.attachments) {
                await (0, exports.verifyMessageMedia)(message, ticket, contact);
            }
            else {
                await (0, exports.verifyMessage)(message, message.text, ticket, contact);
            }
            if (!ticket.queue &&
                !fromMe &&
                !ticket.userId &&
                getSession.queues.length >= 1) {
                await verifyQueue(getSession, message, ticket, contact);
            }
            if (ticket.queue && ticket.queueId) {
                if (!ticket.user) {
                    await (0, ChatbotListenerFacebook_1.sayChatbot)(ticket.queueId, getSession, ticket, contact, message);
                }
            }
        }
        return;
    }
    catch (error) {
        throw new Error(error);
    }
};
exports.handleMessage = handleMessage;
const verifyQueue = async (getSession, msg, ticket, contact) => {
    const { queues, greetingMessage } = await (0, ShowWhatsAppService_1.default)(getSession.id, ticket.companyId);
    if (queues.length === 1) {
        await (0, UpdateTicketService_1.default)({
            ticketData: { queueId: queues[0].id },
            ticketId: ticket.id,
            companyId: ticket.companyId,
            ratingId: undefined
        });
        return;
    }
    const selectedOption = msg.text;
    const choosenQueue = queues[+selectedOption - 1];
    if (choosenQueue) {
        await (0, UpdateTicketService_1.default)({
            ticketData: { queueId: choosenQueue.id },
            ticketId: ticket.id,
            companyId: ticket.companyId,
            ratingId: undefined
        });
        if (choosenQueue.chatbots.length > 0) {
            let options = "";
            choosenQueue.chatbots.forEach((chatbot, index) => {
                options += `*${index + 1}* - ${chatbot.name}\n`;
            });
            const body = (0, Mustache_1.default)(`\u200e${choosenQueue.greetingMessage}\n\n${options}\n*#* Volver al menú principal`, ticket);
            (0, graphAPI_1.sendText)(contact.number, (0, Mustache_1.default)(body, ticket), ticket.whatsapp.facebookUserToken);
            return await (0, exports.verifyMessage)(msg, body, ticket, contact);
        }
        if (!choosenQueue.chatbots.length) {
            const body = (0, Mustache_1.default)(`\u200e${choosenQueue.greetingMessage}`, ticket);
            (0, graphAPI_1.sendText)(contact.number, (0, Mustache_1.default)(body, ticket), ticket.whatsapp.facebookUserToken);
            return await (0, exports.verifyMessage)(msg, body, ticket, contact);
        }
    }
    else {
        let options = "";
        queues.forEach((queue, index) => {
            options += `*${index + 1}* - ${queue.name}\n`;
        });
        const body = (0, Mustache_1.default)(`\u200e${greetingMessage}\n\n${options}`, ticket);
        const debouncedSentMessage = (0, Debounce_1.debounce)(async () => {
            (0, graphAPI_1.sendText)(contact.number, (0, Mustache_1.default)(body, ticket), ticket.whatsapp.facebookUserToken);
            return (0, exports.verifyMessage)(msg, body, ticket, contact);
        }, 3000, ticket.id);
        debouncedSentMessage();
    }
};
