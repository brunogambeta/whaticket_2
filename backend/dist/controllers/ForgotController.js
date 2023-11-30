"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswords = exports.store = void 0;
const uuid_1 = require("uuid");
const SendMail_1 = __importDefault(require("../services/ForgotPassWordServices/SendMail"));
const ResetPassword_1 = __importDefault(require("../services/ResetPasswordService/ResetPassword"));
const store = async (req, res) => {
    const { email } = req.params; // Use req.params para obter o email
    const TokenSenha = (0, uuid_1.v4)();
    const forgotPassword = await (0, SendMail_1.default)(email, TokenSenha);
    if (!forgotPassword) {
        // Houve um erro, pois a função SendMail retornou undefined ou null
        return res.status(404).json({ error: "E-mail enviado com sucesso" });
    }
    return res.json({ message: "E-mail enviado com sucesso" });
};
exports.store = store;
const resetPasswords = async (req, res) => {
    const { email, token, password } = req.params; // Use req.params para obter o token e a nova senha
    const resetPassword = await (0, ResetPassword_1.default)(email, token, password);
    if (!resetPassword) {
        // Houve um erro, pois a função ResetPassword retornou undefined ou null
        return res.status(404).json({ error: "Verifique o Token informado" });
    }
    return res.json({ message: "Senha redefinida com sucesso" });
};
exports.resetPasswords = resetPasswords;
