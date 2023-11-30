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
exports.indexWhatsappsId = exports.checkNumber = exports.indexImage = exports.index = exports.indexLink = exports.OnWhatsAppDto = void 0;
const Yup = __importStar(require("yup"));
const AppError_1 = __importDefault(require("../errors/AppError"));
const GetDefaultWhatsApp_1 = __importDefault(require("../helpers/GetDefaultWhatsApp"));
const SetTicketMessagesAsRead_1 = __importDefault(require("../helpers/SetTicketMessagesAsRead"));
const Whatsapp_1 = __importDefault(require("../models/Whatsapp"));
const CreateOrUpdateContactService_1 = __importDefault(require("../services/ContactServices/CreateOrUpdateContactService"));
const FindOrCreateTicketService_1 = __importDefault(require("../services/TicketServices/FindOrCreateTicketService"));
const ShowTicketService_1 = __importDefault(require("../services/TicketServices/ShowTicketService"));
const CheckIsValidContact_1 = __importDefault(require("../services/WbotServices/CheckIsValidContact"));
const CheckNumber_1 = __importDefault(require("../services/WbotServices/CheckNumber"));
const GetProfilePicUrl_1 = __importDefault(require("../services/WbotServices/GetProfilePicUrl"));
const SendWhatsAppMedia_1 = __importDefault(require("../services/WbotServices/SendWhatsAppMedia"));
const UpdateTicketService_1 = __importDefault(require("../services/TicketServices/UpdateTicketService"));
const wbot_1 = require("../libs/wbot");
const SendWhatsAppMessageLink_1 = __importDefault(require("../services/WbotServices/SendWhatsAppMessageLink"));
const SendWhatsAppMessageAPI_1 = __importDefault(require("../services/WbotServices/SendWhatsAppMessageAPI"));
const SendWhatsappMediaImage_1 = __importDefault(require("../services/WbotServices/SendWhatsappMediaImage"));
const ApiUsages_1 = __importDefault(require("../models/ApiUsages"));
const useDate_1 = require("../utils/useDate");
const moment_1 = __importDefault(require("moment"));
const path_1 = __importDefault(require("path"));
class OnWhatsAppDto {
    constructor(jid, exists) {
        this.jid = jid;
        this.exists = exists;
    }
}
exports.OnWhatsAppDto = OnWhatsAppDto;
const createContact = async (whatsappId, companyId, newContact) => {
    await (0, CheckIsValidContact_1.default)(newContact, companyId);
    const validNumber = await (0, CheckNumber_1.default)(newContact, companyId);
    const profilePicUrl = await (0, GetProfilePicUrl_1.default)(validNumber, companyId);
    const number = validNumber;
    const contactData = {
        name: `${number}`,
        number,
        profilePicUrl,
        isGroup: false,
        companyId
    };
    const contact = await (0, CreateOrUpdateContactService_1.default)(contactData);
    let whatsapp;
    if (whatsappId === undefined) {
        whatsapp = await (0, GetDefaultWhatsApp_1.default)(companyId);
    }
    else {
        whatsapp = await Whatsapp_1.default.findByPk(whatsappId);
        if (whatsapp === null) {
            throw new AppError_1.default(`whatsapp #${whatsappId} not found`);
        }
    }
    const createTicket = await (0, FindOrCreateTicketService_1.default)(contact, whatsapp.id, 0, companyId);
    const ticket = await (0, ShowTicketService_1.default)(createTicket.id, companyId);
    (0, SetTicketMessagesAsRead_1.default)(ticket);
    return ticket;
};
function formatBRNumber(jid) {
    const regexp = new RegExp(/^(\d{2})(\d{2})\d{1}(\d{8})$/);
    if (regexp.test(jid)) {
        const match = regexp.exec(jid);
        if (match && match[1] === '55' && Number.isInteger(Number.parseInt(match[2]))) {
            const ddd = Number.parseInt(match[2]);
            if (ddd < 31) {
                return match[0];
            }
            else if (ddd >= 31) {
                return match[1] + match[2] + match[3];
            }
        }
    }
    else {
        return jid;
    }
}
function createJid(number) {
    if (number.includes('@g.us') || number.includes('@s.whatsapp.net')) {
        return formatBRNumber(number);
    }
    return number.includes('-')
        ? `${number}@g.us`
        : `${formatBRNumber(number)}@s.whatsapp.net`;
}
// export const send = async (req: Request, res: Response): Promise<Response> => {
//     const messageData: MessageData = req.body;
//     const medias = req.files as Express.Multer.File[];
//     try {
//         const authHeader = req.headers.authorization;
//         const [, token] = authHeader.split(" ");
//         const whatsapp = await Whatsapp.findOne({ where: { token } });
//         const companyId = whatsapp.companyId;
//         const company = await ShowPlanCompanyService(companyId);
//         const sendMessageWithExternalApi = company.plan.useExternalApi
//         if (sendMessageWithExternalApi) {
//             if (!whatsapp) {
//                 throw new Error("Não foi possível realizar a operação");
//             }
//             if (messageData.number === undefined) {
//                 throw new Error("O número é obrigatório");
//             }
//             const number = messageData.number;
//             const body = messageData.body;
//             if (medias) {
//                 await Promise.all(
//                     medias.map(async (media: Express.Multer.File) => {
//                         req.app.get("queues").messageQueue.add(
//                             "SendMessage",
//                             {
//                                 whatsappId: whatsapp.id,
//                                 data: {
//                                     number,
//                                     body: media.originalname,
//                                     mediaPath: media.path
//                                 }
//                             },
//                             { removeOnComplete: true, attempts: 3 }
//                         );
//                     })
//                 );
//             } else {
//                 req.app.get("queues").messageQueue.add(
//                     "SendMessage",
//                     {
//                         whatsappId: whatsapp.id,
//                         data: {
//                             number,
//                             body
//                         }
//                     },
//                     { removeOnComplete: true, attempts: 3 }
//                 );
//             }
//             return res.send({ mensagem: "Mensagem enviada!" });
//         }
//         return res.status(400).json({ error: 'Essa empresa não tem permissão para usar a API Externa. Entre em contato com o Suporte para verificar nossos planos!' });
//     } catch (err: any) {
//         console.log(err);
//         if (Object.keys(err).length === 0) {
//             throw new AppError(
//                 "Não foi possível enviar a mensagem, tente novamente em alguns instantes"
//             );
//         } else {
//             throw new AppError(err.message);
//         }
//     }
// };
const indexLink = async (req, res) => {
    const newContact = req.body;
    const { whatsappId } = req.body;
    const { msdelay } = req.body;
    const url = req.body.url;
    const caption = req.body.caption;
    const authHeader = req.headers.authorization;
    const [, token] = authHeader.split(" ");
    const whatsapp = await Whatsapp_1.default.findOne({ where: { token } });
    const companyId = whatsapp.companyId;
    newContact.number = newContact.number.replace("-", "").replace(" ", "");
    const schema = Yup.object().shape({
        number: Yup.string()
            .required()
            .matches(/^\d+$/, "Invalid number format. Only numbers is allowed.")
    });
    try {
        await schema.validate(newContact);
    }
    catch (err) {
        throw new AppError_1.default(err.message);
    }
    const contactAndTicket = await createContact(whatsappId, companyId, newContact.number);
    await (0, SendWhatsAppMessageLink_1.default)({ ticket: contactAndTicket, url, caption, msdelay });
    setTimeout(async () => {
        await (0, UpdateTicketService_1.default)({
            ticketId: contactAndTicket.id,
            ticketData: { status: "closed", sendFarewellMessage: false, amountUsedBotQueues: 0 },
            companyId,
            ratingId: undefined
        });
    }, 200);
    setTimeout(async () => {
        const { dateToClient } = (0, useDate_1.useDate)();
        const hoje = dateToClient(new Date());
        const timestamp = (0, moment_1.default)().format();
        const exist = await ApiUsages_1.default.findOne({
            where: {
                dateUsed: hoje,
                companyId: companyId
            }
        });
        if (exist) {
            await exist.update({
                usedPDF: exist.dataValues["usedPDF"] + 1,
                UsedOnDay: exist.dataValues["UsedOnDay"] + 1,
                updatedAt: timestamp
            });
        }
        else {
            const usage = await ApiUsages_1.default.create({
                companyId: companyId,
                dateUsed: hoje,
            });
            await usage.update({
                usedPDF: usage.dataValues["usedPDF"] + 1,
                UsedOnDay: usage.dataValues["UsedOnDay"] + 1,
                updatedAt: timestamp
            });
        }
    }, 100);
    return res.send({ status: "SUCCESS" });
};
exports.indexLink = indexLink;
const index = async (req, res) => {
    const newContact = req.body;
    const { whatsappId } = req.body;
    const { msdelay } = req.body;
    const { body, quotedMsg } = req.body;
    const medias = req.files;
    const authHeader = req.headers.authorization;
    const [, token] = authHeader.split(" ");
    const whatsapp = await Whatsapp_1.default.findOne({ where: { token } });
    const companyId = whatsapp.companyId;
    newContact.number = newContact.number.replace("-", "").replace(" ", "");
    const schema = Yup.object().shape({
        number: Yup.string()
            .required()
            .matches(/^\d+$/, "Invalid number format. Only numbers is allowed.")
    });
    try {
        await schema.validate(newContact);
    }
    catch (err) {
        throw new AppError_1.default(err.message);
    }
    const contactAndTicket = await createContact(whatsappId, companyId, newContact.number);
    if (medias) {
        await Promise.all(medias.map(async (media) => {
            await (0, SendWhatsAppMedia_1.default)({ body, media, ticket: contactAndTicket });
        }));
    }
    else {
        await (0, SendWhatsAppMessageAPI_1.default)({ body, ticket: contactAndTicket, quotedMsg, msdelay });
    }
    setTimeout(async () => {
        await (0, UpdateTicketService_1.default)({
            ticketId: contactAndTicket.id,
            ticketData: { status: "closed", sendFarewellMessage: false, amountUsedBotQueues: 0 },
            companyId,
            ratingId: undefined
        });
    }, 100);
    setTimeout(async () => {
        const { dateToClient } = (0, useDate_1.useDate)();
        const hoje = dateToClient(new Date());
        const timestamp = (0, moment_1.default)().format();
        const exist = await ApiUsages_1.default.findOne({
            where: {
                dateUsed: hoje,
                companyId: companyId
            }
        });
        if (exist) {
            if (medias) {
                await Promise.all(medias.map(async (media) => {
                    console.log('media', media);
                    const type = path_1.default.extname(media.originalname);
                    console.log('type', type);
                    if (media.mimetype.includes("pdf")) {
                        await exist.update({
                            usedPDF: exist.dataValues["usedPDF"] + 1,
                            UsedOnDay: exist.dataValues["UsedOnDay"] + 1,
                            updatedAt: timestamp
                        });
                    }
                    else if (media.mimetype.includes("image")) {
                        await exist.update({
                            usedImage: exist.dataValues["usedImage"] + 1,
                            UsedOnDay: exist.dataValues["UsedOnDay"] + 1,
                            updatedAt: timestamp
                        });
                    }
                    else if (media.mimetype.includes("video")) {
                        await exist.update({
                            usedVideo: exist.dataValues["usedVideo"] + 1,
                            UsedOnDay: exist.dataValues["UsedOnDay"] + 1,
                            updatedAt: timestamp
                        });
                    }
                    else {
                        await exist.update({
                            usedOther: exist.dataValues["usedOther"] + 1,
                            UsedOnDay: exist.dataValues["UsedOnDay"] + 1,
                            updatedAt: timestamp
                        });
                    }
                }));
            }
            else {
                await exist.update({
                    usedText: exist.dataValues["usedText"] + 1,
                    UsedOnDay: exist.dataValues["UsedOnDay"] + 1,
                    updatedAt: timestamp
                });
            }
        }
        else {
            await ApiUsages_1.default.create({
                companyId: companyId,
                dateUsed: hoje,
            });
            if (medias) {
                await Promise.all(medias.map(async (media) => {
                    console.log('media', media);
                    const type = path_1.default.extname(media.originalname);
                    console.log('type', type);
                    if (media.mimetype.includes("pdf")) {
                        await exist.update({
                            usedPDF: exist.dataValues["usedPDF"] + 1,
                            UsedOnDay: exist.dataValues["UsedOnDay"] + 1,
                            updatedAt: timestamp
                        });
                    }
                    else if (media.mimetype.includes("image")) {
                        await exist.update({
                            usedImage: exist.dataValues["usedImage"] + 1,
                            UsedOnDay: exist.dataValues["UsedOnDay"] + 1,
                            updatedAt: timestamp
                        });
                    }
                    else if (media.mimetype.includes("video")) {
                        await exist.update({
                            usedVideo: exist.dataValues["usedVideo"] + 1,
                            UsedOnDay: exist.dataValues["UsedOnDay"] + 1,
                            updatedAt: timestamp
                        });
                    }
                    else {
                        await exist.update({
                            usedOther: exist.dataValues["usedOther"] + 1,
                            UsedOnDay: exist.dataValues["UsedOnDay"] + 1,
                            updatedAt: timestamp
                        });
                    }
                }));
            }
            else {
                await exist.update({
                    usedText: exist.dataValues["usedText"] + 1,
                    UsedOnDay: exist.dataValues["UsedOnDay"] + 1,
                    updatedAt: timestamp
                });
            }
        }
    }, 100);
    return res.send({ status: "SUCCESS" });
};
exports.index = index;
const indexImage = async (req, res) => {
    const newContact = req.body;
    const { whatsappId } = req.body;
    const { msdelay } = req.body;
    const url = req.body.url;
    const caption = req.body.caption;
    const authHeader = req.headers.authorization;
    const [, token] = authHeader.split(" ");
    const whatsapp = await Whatsapp_1.default.findOne({ where: { token } });
    const companyId = whatsapp.companyId;
    newContact.number = newContact.number.replace("-", "").replace(" ", "");
    const schema = Yup.object().shape({
        number: Yup.string()
            .required()
            .matches(/^\d+$/, "Invalid number format. Only numbers is allowed.")
    });
    try {
        await schema.validate(newContact);
    }
    catch (err) {
        throw new AppError_1.default(err.message);
    }
    const contactAndTicket = await createContact(whatsappId, companyId, newContact.number);
    if (url) {
        await (0, SendWhatsappMediaImage_1.default)({ ticket: contactAndTicket, url, caption, msdelay });
    }
    setTimeout(async () => {
        await (0, UpdateTicketService_1.default)({
            ticketId: contactAndTicket.id,
            ticketData: { status: "closed", sendFarewellMessage: false, amountUsedBotQueues: 0 },
            companyId,
            ratingId: undefined
        });
    }, 100);
    setTimeout(async () => {
        const { dateToClient } = (0, useDate_1.useDate)();
        const hoje = dateToClient(new Date());
        const timestamp = (0, moment_1.default)().format();
        const exist = await ApiUsages_1.default.findOne({
            where: {
                dateUsed: hoje,
                companyId: companyId
            }
        });
        if (exist) {
            await exist.update({
                usedImage: exist.dataValues["usedImage"] + 1,
                UsedOnDay: exist.dataValues["UsedOnDay"] + 1,
                updatedAt: timestamp
            });
        }
        else {
            const usage = await ApiUsages_1.default.create({
                companyId: companyId,
                dateUsed: hoje,
            });
            await usage.update({
                usedImage: usage.dataValues["usedImage"] + 1,
                UsedOnDay: usage.dataValues["UsedOnDay"] + 1,
                updatedAt: timestamp
            });
        }
    }, 100);
    return res.send({ status: "SUCCESS" });
};
exports.indexImage = indexImage;
const checkNumber = async (req, res) => {
    const newContact = req.body;
    const authHeader = req.headers.authorization;
    const [, token] = authHeader.split(" ");
    const whatsapp = await Whatsapp_1.default.findOne({ where: { token } });
    const companyId = whatsapp.companyId;
    const number = newContact.number.replace("-", "").replace(" ", "");
    const whatsappDefault = await (0, GetDefaultWhatsApp_1.default)(companyId);
    const wbot = (0, wbot_1.getWbot)(whatsappDefault.id);
    const jid = createJid(number);
    try {
        const [result] = (await wbot.onWhatsApp(jid));
        if (result.exists) {
            setTimeout(async () => {
                const { dateToClient } = (0, useDate_1.useDate)();
                const hoje = dateToClient(new Date());
                const timestamp = (0, moment_1.default)().format();
                const exist = await ApiUsages_1.default.findOne({
                    where: {
                        dateUsed: hoje,
                        companyId: companyId
                    }
                });
                if (exist) {
                    await exist.update({
                        usedCheckNumber: exist.dataValues["usedCheckNumber"] + 1,
                        UsedOnDay: exist.dataValues["UsedOnDay"] + 1,
                        updatedAt: timestamp
                    });
                }
                else {
                    const usage = await ApiUsages_1.default.create({
                        companyId: companyId,
                        dateUsed: hoje,
                    });
                    await usage.update({
                        usedCheckNumber: usage.dataValues["usedCheckNumber"] + 1,
                        UsedOnDay: usage.dataValues["UsedOnDay"] + 1,
                        updatedAt: timestamp
                    });
                }
            }, 100);
            return res.status(200).json({ existsInWhatsapp: true, number: number, numberFormatted: result.jid });
        }
    }
    catch (error) {
        return res.status(400).json({ existsInWhatsapp: false, number: jid, error: "Not exists on Whatsapp" });
    }
};
exports.checkNumber = checkNumber;
// export const indexVideo = async (
//     req: Request,
//     res: Response
// ): Promise<Response> => {
//     const newContact: ContactData = req.body;
//     const { whatsappId }: WhatsappData = req.body;
//     const url = req.body.url;
//     const caption = req.body.caption;
//     newContact.number = newContact.number.replace("-", "").replace(" ", "");
//     const schema = Yup.object().shape({
//         number: Yup.string()
//             .required()
//             .matches(/^\d+$/, "Invalid number format. Only numbers is allowed.")
//     });
//     try {
//         await schema.validate(newContact);
//     } catch (err: any) {
//         throw new AppError(err.message);
//     }
//     const contactAndTicket = await createContact(whatsappId, newContact.number);
//     await SendWhatsAppMediaVideo({ ticket: contactAndTicket, url, caption });
//     setTimeout(async () => {
//         await UpdateTicketService({
//             ticketId: contactAndTicket.id,
//             ticketData: { status: "closed" }
//         });
//     }, 1000);
//     return res.send({ status: "SUCCESS" });
// };
// export const indexToMany = async (
//     req: Request,
//     res: Response
// ): Promise<Response> => {
//     const to: string = req.body.to;
//     const { whatsappId }: WhatsappData = req.body;
//     const { body, quotedMsg }: MessageData = req.body;
//     const myArray = to.split(";");
//     let newContact: ContactData;
//     for (var i = 0; i < myArray.length; i++) {
//         const number = myArray[i];
//         newContact = { number: number };
//         console.log("newContact", newContact);
//         const schema = Yup.object().shape({
//             number: Yup.string()
//                 .required()
//                 .matches(/^\d+$/, "Invalid number format. Only numbers is allowed.")
//         });
//         try {
//             await schema.validate(newContact);
//         } catch (err: any) {
//             throw new AppError(err.message);
//         }
//         const contactAndTicket = await createContact(whatsappId, newContact.number);
//         await SendWhatsAppMessageToMany({
//             body,
//             ticket: contactAndTicket,
//             quotedMsg
//         });
//         setTimeout(async () => {
//             await UpdateTicketService({
//                 ticketId: contactAndTicket.id,
//                 ticketData: { status: "closed" }
//             });
//         }, 1000);
//     }
//     return res.send({ status: "SUCCESS" });
// };
// export const indexToManyLinkPdf = async (
//     req: Request,
//     res: Response
// ): Promise<Response> => {
//     const { whatsappId }: WhatsappData = req.body;
//     const data: MediaUrlMessage = req.body.messageData;
//     // console.log('data', data)
//     let url;
//     let caption;
//     url = data.url;
//     caption = data.caption;
//     const myArray = data.to.split(";");
//     let newContact: ContactData;
//     for (var i = 0; i < myArray.length; i++) {
//         const number = myArray[i];
//         newContact = { number: number };
//         const schema = Yup.object().shape({
//             number: Yup.string()
//                 .required()
//                 .matches(/^\d+$/, "Invalid number format. Only numbers is allowed.")
//         });
//         try {
//             await schema.validate(newContact);
//         } catch (err: any) {
//             throw new AppError(err.message);
//         }
//         const contactAndTicket = await createContact(whatsappId, newContact.number);
//         console.log("contactAndTicket", contactAndTicket.id);
//         const ticket = contactAndTicket;
//         // await SendWhatsAppMessageToManyPdf({ ticket: contactAndTicket, url, caption });
//         await sendUrlMediaMessage(ticket, data);
//         setTimeout(async () => {
//             await UpdateTicketService({
//                 ticketId: contactAndTicket.id,
//                 ticketData: { status: "closed" }
//             });
//         }, 1000);
//     }
//     return res.send({ status: "SUCCESS" });
// };
// export const indexToManyImage = async (
//     req: Request,
//     res: Response
// ): Promise<Response> => {
//     const { whatsappId }: WhatsappData = req.body;
//     const data: MediaUrlMessage = req.body.messageData;
//     let url;
//     let caption;
//     url = data.url;
//     caption = data.caption;
//     const myArray = data.to.split(";");
//     let newContact: ContactData;
//     for (var i = 0; i < myArray.length; i++) {
//         const number = myArray[i];
//         newContact = { number: number };
//         const schema = Yup.object().shape({
//             number: Yup.string()
//                 .required()
//                 .matches(/^\d+$/, "Invalid number format. Only numbers is allowed.")
//         });
//         try {
//             await schema.validate(newContact);
//         } catch (err: any) {
//             throw new AppError(err.message);
//         }
//         const contactAndTicket = await createContact(whatsappId, newContact.number);
//         await sendUrlMediaMessageImage(contactAndTicket, data);
//         setTimeout(async () => {
//             await UpdateTicketService({
//                 ticketId: contactAndTicket.id,
//                 ticketData: { status: "closed" }
//             });
//         }, 1000);
//     }
//     return res.send({ status: "SUCCESS" });
// };
const indexWhatsappsId = async (req, res) => {
    console.log('req', req);
    console.log('req', req.user);
    return res.status(200).json('oi');
    // const { companyId } = req.user;
    // const whatsapps = await ListWhatsAppsService({ companyId });
    // let wpp = [];
    // if (whatsapps.length > 0) {
    //     whatsapps.forEach(whatsapp => {
    //         let wppString;
    //         wppString = {
    //             id: whatsapp.id,
    //             name: whatsapp.name,
    //             status: whatsapp.status,
    //             isDefault: whatsapp.isDefault,
    //             number: whatsapp.number
    //         }
    //         wpp.push(wppString)
    //     });
    // }
    // return res.status(200).json(wpp);
};
exports.indexWhatsappsId = indexWhatsappsId;
