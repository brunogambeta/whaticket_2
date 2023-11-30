"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AppError_1 = __importDefault(require("../../errors/AppError"));
const CheckSettings_1 = __importDefault(require("../../helpers/CheckSettings"));
const Contact_1 = __importDefault(require("../../models/Contact"));
const CreateContactService = async ({ name, number, email = "", acceptAudioMessage, active, companyId, extraInfo = [] }) => {
    const numberExists = await Contact_1.default.findOne({
        where: { number, companyId }
    });
    if (numberExists) {
        throw new AppError_1.default("ERR_DUPLICATED_CONTACT");
    }
    const acceptAudioMessageContact = await (0, CheckSettings_1.default)("acceptAudioMessageContact");
    const contact = await Contact_1.default.create({
        name,
        number,
        email,
        acceptAudioMessage: acceptAudioMessageContact === 'enabled' ? true : false,
        active,
        extraInfo,
        companyId
    }, {
        include: ["extraInfo"]
    });
    return contact;
};
exports.default = CreateContactService;
