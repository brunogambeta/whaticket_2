"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = exports.remove = exports.update = exports.show = exports.store = exports.index = void 0;
const socket_1 = require("../libs/socket");
const lodash_1 = require("lodash");
const CheckSettings_1 = __importDefault(require("../helpers/CheckSettings"));
const AppError_1 = __importDefault(require("../errors/AppError"));
const CreateUserService_1 = __importDefault(require("../services/UserServices/CreateUserService"));
const ListUsersService_1 = __importDefault(require("../services/UserServices/ListUsersService"));
const UpdateUserService_1 = __importDefault(require("../services/UserServices/UpdateUserService"));
const ShowUserService_1 = __importDefault(require("../services/UserServices/ShowUserService"));
const DeleteUserService_1 = __importDefault(require("../services/UserServices/DeleteUserService"));
const SimpleListService_1 = __importDefault(require("../services/UserServices/SimpleListService"));
const CreateCompanyService_1 = __importDefault(require("../services/CompanyService/CreateCompanyService"));
const SendMail_1 = require("../helpers/SendMail");
const useDate_1 = require("../utils/useDate");
const ShowCompanyService_1 = __importDefault(require("../services/CompanyService/ShowCompanyService"));
const wbot_1 = require("../libs/wbot");
const FindCompaniesWhatsappService_1 = __importDefault(require("../services/CompanyService/FindCompaniesWhatsappService"));
const User_1 = __importDefault(require("../models/User"));
const index = async (req, res) => {
    const { searchParam, pageNumber } = req.query;
    const { companyId, profile } = req.user;
    const { users, count, hasMore } = await (0, ListUsersService_1.default)({
        searchParam,
        pageNumber,
        companyId,
        profile
    });
    return res.json({ users, count, hasMore });
};
exports.index = index;
const store = async (req, res) => {
    const { email, password, name, phone, profile, companyId: bodyCompanyId, queueIds, companyName, planId, startWork, endWork } = req.body;
    let userCompanyId = null;
    const { dateToClient } = (0, useDate_1.useDate)();
    if (req.user !== undefined) {
        const { companyId: cId } = req.user;
        userCompanyId = cId;
    }
    if (req.url === "/signup" &&
        (await (0, CheckSettings_1.default)("userCreation")) === "disabled") {
        throw new AppError_1.default("ERR_USER_CREATION_DISABLED", 403);
    }
    else if (req.url !== "/signup" && req.user.profile !== "admin") {
        throw new AppError_1.default("ERR_NO_PERMISSION", 403);
    }
    const companyUser = bodyCompanyId || userCompanyId;
    if (!companyUser) {
        const dataNowMoreTwoDays = new Date();
        dataNowMoreTwoDays.setDate(dataNowMoreTwoDays.getDate() + 3);
        const date = dataNowMoreTwoDays.toISOString().split("T")[0];
        const companyData = {
            name: companyName,
            email: email,
            phone: phone,
            planId: planId,
            status: true,
            dueDate: date,
            recurrence: "",
            document: "",
            paymentMethod: "",
            password: password,
            companyUserName: name,
            startWork: startWork,
            endWork: endWork
        };
        const user = await (0, CreateCompanyService_1.default)(companyData);
        try {
            const _email = {
                to: email,
                subject: `Login e senha da Empresa ${companyName}`,
                text: `Olá ${name}, este é um email sobre o cadastro da ${companyName}!<br><br>
        Segue os dados da sua empresa:<br><br>Nome: ${companyName}<br>Email: ${email}<br>Senha: ${password}<br>Data Vencimento Trial: ${dateToClient(date)}<br>acesse pelo site:<br> https://omni.zapwhite.com.br`
            };
            await (0, SendMail_1.SendMail)(_email);
        }
        catch (error) {
            console.log('Não consegui enviar o email');
        }
        try {
            const company = await (0, ShowCompanyService_1.default)(1);
            const whatsappCompany = await (0, FindCompaniesWhatsappService_1.default)(company.id);
            if (whatsappCompany.whatsapps[0].status === "CONNECTED" && (phone !== undefined || !(0, lodash_1.isNil)(phone) || !(0, lodash_1.isEmpty)(phone))) {
                const whatsappId = whatsappCompany.whatsapps[0].id;
                const wbot = (0, wbot_1.getWbot)(whatsappId);
                const body = `Olá ${name}, este é uma mensagem sobre o cadastro da ${companyName}!\n\nSegue os dados da sua empresa:\n\nNome: ${companyName}\nEmail: ${email}\nSenha: ${password}\nData Vencimento Trial: ${dateToClient(date)}\n\nacesse pelo site:\n https://omni.zapwhite.com.br`;
                await wbot.sendMessage(`55${phone}@s.whatsapp.net`, { text: body });
            }
        }
        catch (error) {
            console.log('Não consegui enviar a mensagem');
        }
        return res.status(200).json(user);
    }
    if (companyUser) {
        const user = await (0, CreateUserService_1.default)({
            email,
            password,
            name,
            profile,
            companyId: companyUser,
            queueIds,
            startWork,
            endWork
        });
        const io = (0, socket_1.getIO)();
        io.emit(`company-${userCompanyId}-user`, {
            action: "create",
            user
        });
        return res.status(200).json(user);
    }
};
exports.store = store;
// export const store = async (req: Request, res: Response): Promise<Response> => {
//   const {
//     email,
//     password,
//     name,
//     profile,
//     companyId: bodyCompanyId,
//     queueIds
//   } = req.body;
//   let userCompanyId: number | null = null;
//   if (req.user !== undefined) {
//     const { companyId: cId } = req.user;
//     userCompanyId = cId;
//   }
//   if (
//     req.url === "/signup" &&
//     (await CheckSettingsHelper("userCreation")) === "disabled"
//   ) {
//     throw new AppError("ERR_USER_CREATION_DISABLED", 403);
//   } else if (req.url !== "/signup" && req.user.profile !== "admin") {
//     throw new AppError("ERR_NO_PERMISSION", 403);
//   }
//   const user = await CreateUserService({
//     email,
//     password,
//     name,
//     profile,
//     companyId: bodyCompanyId || userCompanyId,
//     queueIds
//   });
//   const io = getIO();
//   io.emit(`company-${userCompanyId}-user`, {
//     action: "create",
//     user
//   });
//   return res.status(200).json(user);
// };
const show = async (req, res) => {
    const { userId } = req.params;
    const user = await (0, ShowUserService_1.default)(userId);
    return res.status(200).json(user);
};
exports.show = show;
const update = async (req, res) => {
    if (req.user.profile !== "admin") {
        throw new AppError_1.default("ERR_NO_PERMISSION", 403);
    }
    const { id: requestUserId, companyId } = req.user;
    const { userId } = req.params;
    const userData = req.body;
    const user = await (0, UpdateUserService_1.default)({
        userData,
        userId,
        companyId,
        requestUserId: +requestUserId
    });
    const io = (0, socket_1.getIO)();
    io.emit(`company-${companyId}-user`, {
        action: "update",
        user
    });
    return res.status(200).json(user);
};
exports.update = update;
const remove = async (req, res) => {
    const { userId } = req.params;
    const { companyId, id, profile } = req.user;
    if (profile !== "admin") {
        throw new AppError_1.default("ERR_NO_PERMISSION", 403);
    }
    const user = await User_1.default.findOne({
        where: { id: userId }
    });
    if (companyId !== user.companyId) {
        return res.status(400).json({ error: "Você não possui permissão para acessar este recurso!" });
    }
    else {
        await (0, DeleteUserService_1.default)(userId, companyId);
        const io = (0, socket_1.getIO)();
        io.emit(`company-${companyId}-user`, {
            action: "delete",
            userId
        });
        return res.status(200).json({ message: "User deleted" });
    }
};
exports.remove = remove;
const list = async (req, res) => {
    const { companyId } = req.query;
    const { companyId: userCompanyId } = req.user;
    const users = await (0, SimpleListService_1.default)({
        companyId: companyId ? +companyId : userCompanyId
    });
    return res.status(200).json(users);
};
exports.list = list;
