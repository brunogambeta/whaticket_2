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
exports.initWbot = exports.restartWbot = exports.removeWbot = exports.getWbot = void 0;
// import makeWASocket, {
//   AuthenticationState,
//   DisconnectReason,
//   fetchLatestBaileysVersion,
//   makeInMemoryStore,
//   WASocket,
//   MessageRetryMap,
//   delay,
//   jidNormalizedUser
// } from "@adiwajshing/baileys";
const node_cache_1 = __importDefault(require("node-cache"));
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
//import MAIN_LOGGER from "@adiwajshing/baileys/lib/Utils/logger";
const logger_1 = __importDefault(require("@whiskeysockets/baileys/lib/Utils/logger"));
const Whatsapp_1 = __importDefault(require("../models/Whatsapp"));
const logger_2 = require("../utils/logger");
const AppError_1 = __importDefault(require("../errors/AppError"));
const socket_1 = require("./socket");
const StartWhatsAppSession_1 = require("../services/WbotServices/StartWhatsAppSession");
const DeleteBaileysService_1 = __importDefault(require("../services/BaileysServices/DeleteBaileysService"));
const authState_1 = __importDefault(require("../helpers/authState"));
//const msgRetryCounterMap: MessageRetryMap = {}; //<- ERRO MESSAGE RETRY MAP
const msgRetryCounterCache = new node_cache_1.default();
const loggerBaileys = logger_1.default.child({});
loggerBaileys.level = "silent";
const sessions = [];
const retriesQrCodeMap = new Map();
const getWbot = (whatsappId) => {
    const sessionIndex = sessions.findIndex(s => s.id === whatsappId);
    if (sessionIndex === -1) {
        throw new AppError_1.default("ERR_WAPP_NOT_INITIALIZED");
    }
    return sessions[sessionIndex];
};
exports.getWbot = getWbot;
const removeWbot = async (whatsappId, isLogout = true) => {
    try {
        const sessionIndex = sessions.findIndex(s => s.id === whatsappId);
        if (sessionIndex !== -1) {
            if (isLogout) {
                sessions[sessionIndex].logout();
                sessions[sessionIndex].ws.close();
            }
            sessions.splice(sessionIndex, 1);
        }
    }
    catch (err) {
        logger_2.logger.error(err);
    }
};
exports.removeWbot = removeWbot;
const restartWbot = async (companyId, session) => {
    try {
        const options = {
            where: {
                companyId,
            },
            attributes: ["id"],
        };
        const whatsapp = await Whatsapp_1.default.findAll(options);
        whatsapp.map(async (c) => {
            const sessionIndex = sessions.findIndex(s => s.id === c.id);
            if (sessionIndex !== -1) {
                sessions[sessionIndex].ws.close();
            }
        });
    }
    catch (err) {
        logger_2.logger.error(err);
    }
};
exports.restartWbot = restartWbot;
const initWbot = async (whatsapp) => {
    return new Promise((resolve, reject) => {
        try {
            (async () => {
                const io = (0, socket_1.getIO)();
                const { id, name, provider } = whatsapp;
                const { version, isLatest } = await (0, baileys_1.fetchLatestBaileysVersion)();
                logger_2.logger.info(`using WA v${version.join(".")}, isLatest: ${isLatest}`);
                logger_2.logger.info(`isMultidevice: ${provider}`);
                logger_2.logger.info(`Starting session ${name}`);
                let retriesQrCode = 0;
                let wsocket = null;
                const store = (0, baileys_1.makeInMemoryStore)({
                    logger: loggerBaileys
                });
                const { state, saveState } = await (0, authState_1.default)(whatsapp);
                wsocket = (0, baileys_1.default)({
                    logger: loggerBaileys,
                    printQRInTerminal: true,
                    browser: [process.env.BROWSER_CLIENT || "WaZap", process.env.BROWSER_NAME || "Chrome", process.env.BROWSER_VERSION || "10.0"],
                    auth: state,
                    version,
                    defaultQueryTimeoutMs: 60000,
                    connectTimeoutMs: 60000,
                    keepAliveIntervalMs: 60000,
                    msgRetryCounterCache, //<- ERRO MESSAGE RETRY MAP
                    // comentado 24/02/2023
                    // getMessage: async key => {
                    //   const message = await Message.findOne({
                    //     where: {
                    //       id: key.id
                    //     }
                    //   });
                    //   await delay(1000);
                    //   if (!message) return;
                    //   return {
                    //     conversation: message.body
                    //   };
                    // },
                    // emitOwnEvents: false,
                    // generateHighQualityLinkPreview: true,
                    // qrTimeout: 15_000,
                    // syncFullHistory: true,
                    // shouldIgnoreJid: jid => isJidBroadcast(jid)
                    // patchMessageBeforeSending: (message) => {
                    //   const requiresPatch = !!(
                    //     message.buttonsMessage ||
                    //     message.templateMessage ||
                    //     message.listMessage
                    //   );
                    //   if (requiresPatch) {
                    //     message = {
                    //       viewOnceMessage: {
                    //         message: {
                    //           messageContextInfo: {
                    //             deviceListMetadataVersion: 2,
                    //             deviceListMetadata: {},
                    //           },
                    //           ...message,
                    //         },
                    //       },
                    //     };
                    //   }
                    //   return message;
                    // }
                });
                wsocket.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
                    logger_2.logger.info(`Socket ${name} Connection Update ${connection || ""} ${lastDisconnect || ""}`);
                    const disconect = lastDisconnect?.error?.output?.statusCode;
                    if (connection === "close") {
                        if (disconect === 403) {
                            await whatsapp.update({ status: "PENDING", session: "", number: "" });
                            (0, exports.removeWbot)(id, false);
                            await (0, DeleteBaileysService_1.default)(whatsapp.id);
                            io.emit(`company-${whatsapp.companyId}-whatsappSession`, {
                                action: "update",
                                session: whatsapp
                            });
                        }
                        if (disconect !== baileys_1.DisconnectReason.loggedOut) {
                            (0, exports.removeWbot)(id, false);
                            setTimeout(() => (0, StartWhatsAppSession_1.StartWhatsAppSession)(whatsapp, whatsapp.companyId), 2000);
                        }
                        else {
                            await whatsapp.update({ status: "PENDING", session: "", number: "" });
                            await (0, DeleteBaileysService_1.default)(whatsapp.id);
                            io.emit(`company-${whatsapp.companyId}-whatsappSession`, {
                                action: "update",
                                session: whatsapp
                            });
                            (0, exports.removeWbot)(id, false);
                            setTimeout(() => (0, StartWhatsAppSession_1.StartWhatsAppSession)(whatsapp, whatsapp.companyId), 2000);
                        }
                    }
                    if (connection === "open") {
                        await whatsapp.update({
                            status: "CONNECTED",
                            qrcode: "",
                            retries: 0,
                            number: wsocket.type === "md"
                                ? (0, baileys_1.jidNormalizedUser)(wsocket.user.id).split("@")[0]
                                : "-"
                        });
                        io.emit(`company-${whatsapp.companyId}-whatsappSession`, {
                            action: "update",
                            session: whatsapp
                        });
                        const sessionIndex = sessions.findIndex(s => s.id === whatsapp.id);
                        if (sessionIndex === -1) {
                            wsocket.id = whatsapp.id;
                            sessions.push(wsocket);
                        }
                        resolve(wsocket);
                    }
                    if (qr !== undefined) {
                        if (retriesQrCodeMap.get(id) && retriesQrCodeMap.get(id) >= 3) {
                            await whatsapp.update({
                                status: "DISCONNECTED",
                                qrcode: ""
                            });
                            await (0, DeleteBaileysService_1.default)(whatsapp.id);
                            io.of(`${whatsapp.companyId}`).emit("whatsappSession", {
                                action: "update",
                                session: whatsapp
                            });
                            wsocket.ev.removeAllListeners("connection.update");
                            wsocket.ws.close();
                            wsocket = null;
                            retriesQrCodeMap.delete(id);
                        }
                        else {
                            logger_2.logger.info(`Session QRCode Generate ${name}`);
                            retriesQrCodeMap.set(id, (retriesQrCode += 1));
                            await whatsapp.update({
                                qrcode: qr,
                                status: "qrcode",
                                retries: 0,
                                number: ""
                            });
                            const sessionIndex = sessions.findIndex(s => s.id === whatsapp.id);
                            if (sessionIndex === -1) {
                                wsocket.id = whatsapp.id;
                                sessions.push(wsocket);
                            }
                            io.emit(`company-${whatsapp.companyId}-whatsappSession`, {
                                action: "update",
                                session: whatsapp
                            });
                        }
                    }
                });
                wsocket.ev.on("creds.update", saveState);
                wsocket.store = store;
                store.bind(wsocket.ev);
            })();
        }
        catch (error) {
            console.log("Error no init Wbot");
            (0, exports.initWbot)(whatsapp);
        }
    });
};
exports.initWbot = initWbot;
