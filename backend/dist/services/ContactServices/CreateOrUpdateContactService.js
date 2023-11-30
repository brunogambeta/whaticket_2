"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CheckSettings_1 = __importDefault(require("../../helpers/CheckSettings"));
const socket_1 = require("../../libs/socket");
const Contact_1 = __importDefault(require("../../models/Contact"));
const CreateOrUpdateContactService = async ({ name, number: rawNumber, profilePicUrl, isGroup, email = "", channel = "whatsapp", companyId, extraInfo = [] }) => {
    const number = isGroup ? rawNumber : rawNumber.replace(/[^0-9]/g, "");
    const io = (0, socket_1.getIO)();
    let contact;
    contact = await Contact_1.default.findOne({
        where: {
            number,
            companyId
        }
    });
    if (contact) {
        contact.update({ profilePicUrl });
        if (isGroup) {
            contact.update({ name });
        }
        io.emit(`company-${companyId}-contact`, {
            action: "update",
            contact
        });
    }
    else {
        const acceptAudioMessageContact = await (0, CheckSettings_1.default)("acceptAudioMessageContact");
        contact = await Contact_1.default.create({
            name,
            number,
            profilePicUrl,
            email,
            isGroup,
            extraInfo,
            companyId,
            channel,
            acceptAudioMessage: acceptAudioMessageContact === 'enabled' ? true : false
        });
        io.emit(`company-${companyId}-contact`, {
            action: "create",
            contact
        });
    }
    return contact;
};
exports.default = CreateOrUpdateContactService;
