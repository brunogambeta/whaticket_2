"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeAttachment = void 0;
const fs_1 = __importDefault(require("fs"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
// import formatBody from "../../helpers/Mustache";
const graphAPI_1 = require("./graphAPI");
// import cloudinary  from "cloudinary"
const facebookMessageListener_1 = require("./facebookMessageListener");
const typeAttachment = (media) => {
    if (media.mimetype.includes("image")) {
        return "image";
    }
    if (media.mimetype.includes("video")) {
        return "video";
    }
    if (media.mimetype.includes("audio")) {
        return "audio";
    }
    return "file";
};
exports.typeAttachment = typeAttachment;
const sendFacebookMessageMedia = async ({ media, url, ticket, body }) => {
    try {
        const type = (0, exports.typeAttachment)(media);
        const sendMessage = await (0, graphAPI_1.sendAttachmentFromUrl)(ticket.contact.number, `${process.env.BACKEND_URL}/public/company${ticket.companyId}/${media.filename}`, type, ticket.whatsapp.facebookUserToken);
        await ticket.update({ lastMessage: body || media.filename });
        fs_1.default.unlinkSync(media.path);
        await (0, facebookMessageListener_1.verifyMessage)(sendMessage, body || media.filename, ticket, ticket.contact);
        return sendMessage;
    }
    catch (err) {
        throw new AppError_1.default("ERR_SENDING_FACEBOOK_MSG");
    }
};
exports.default = sendFacebookMessageMedia;
