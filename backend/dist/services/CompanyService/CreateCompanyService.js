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
const Yup = __importStar(require("yup"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const Company_1 = __importDefault(require("../../models/Company"));
const User_1 = __importDefault(require("../../models/User"));
const Setting_1 = __importDefault(require("../../models/Setting"));
const database_1 = __importDefault(require("../../database"));
const CreateCompanyService = async (companyData) => {
    const { name, phone, password, email, status, planId, dueDate, recurrence, document, paymentMethod, companyUserName } = companyData;
    const companySchema = Yup.object().shape({
        name: Yup.string()
            .min(2, "ERR_COMPANY_INVALID_NAME")
            .required("ERR_COMPANY_INVALID_NAME")
    });
    try {
        await companySchema.validate({ name });
    }
    catch (err) {
        throw new AppError_1.default(err.message);
    }
    const t = await database_1.default.transaction();
    try {
        const company = await Company_1.default.create({
            name,
            phone,
            email,
            status,
            planId,
            dueDate,
            recurrence,
            document,
            paymentMethod
        }, { transaction: t });
        await User_1.default.create({
            name: companyUserName ? companyUserName : name,
            email: company.email,
            password: password ? password : "mudar123",
            profile: "admin",
            companyId: company.id
        }, { transaction: t });
        // Fechamento automatico de ticket
        await Setting_1.default.create({
            companyId: company.id,
            key: "hoursCloseTicketsAuto",
            value: "9999999999"
        }, { transaction: t });
        // Aceitar msg de grupos
        await Setting_1.default.create({
            companyId: company.id,
            key: "CheckMsgIsGroup",
            value: "enabled"
        }, { transaction: t });
        // Aviso sobre ligação
        await Setting_1.default.create({
            companyId: company.id,
            key: "acceptCallWhatsapp",
            value: "disabled"
        }, { transaction: t });
        // Agendamento de expediente
        await Setting_1.default.create({
            companyId: company.id,
            key: "scheduleType",
            value: "disabled"
        }, { transaction: t });
        // Avaliações
        await Setting_1.default.create({
            companyId: company.id,
            key: "userRating",
            value: "disabled"
        }, { transaction: t });
        // Tipo do Chatbot
        await Setting_1.default.create({
            companyId: company.id,
            key: "chatBotType",
            value: "text"
        }, { transaction: t });
        // Escolher atendente aleatoriamente
        await Setting_1.default.create({
            companyId: company.id,
            key: "userRandom",
            value: "disabled"
        }, { transaction: t });
        // Enviar mensagem de transferencia
        await Setting_1.default.create({
            companyId: company.id,
            key: "sendMsgTransfTicket",
            value: "disabled"
        }, { transaction: t });
        // Enviar mensagem ao aceitar ticket
        await Setting_1.default.create({
            companyId: company.id,
            key: "sendGreetingAccepted",
            value: "disabled"
        }, { transaction: t });
        await t.commit();
        return company;
    }
    catch (error) {
        await t.rollback();
        throw new AppError_1.default("Não foi possível criar a empresa!");
    }
};
exports.default = CreateCompanyService;
