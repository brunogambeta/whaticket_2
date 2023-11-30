"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const sequelize_1 = __importDefault(require("sequelize"));
const database_1 = __importDefault(require("../../database"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const SendMail = async (email, tokenSenha) => {
    // Verifique se o email existe no banco de dados
    const { hasResult, data } = await filterEmail(email);
    if (!hasResult) {
        return { status: 404, message: "Email não encontrado" };
    }
    const userData = data[0][0];
    if (!userData || userData.companyId === undefined) {
        return { status: 404, message: "Dados do usuário não encontrados" };
    }
    const companyId = userData.companyId;
    const urlSmtp = process.env.MAIL_HOST; // Use a variável de ambiente para o host SMTP
    const userSmtp = process.env.MAIL_USER; // Use a variável de ambiente para o usuário SMTP
    const passwordSmpt = process.env.MAIL_PASS; // Use a variável de ambiente para a senha SMTP
    const fromEmail = process.env.MAIL_FROM; // Use a variável de ambiente para o email de origem
    const transporter = nodemailer_1.default.createTransport({
        host: urlSmtp,
        port: Number(process.env.MAIL_PORT),
        secure: false,
        auth: {
            user: userSmtp,
            pass: passwordSmpt
        }
    });
    if (hasResult === true) {
        const { hasResults, datas } = await insertToken(email, tokenSenha);
        async function sendEmail() {
            try {
                const mailOptions = {
                    from: fromEmail,
                    to: email,
                    subject: "Redefinição de Senha - Automatiza AI",
                    text: `Olá,\n\nVocê solicitou a redefinição de senha para sua conta na Automatiza AI. Utilize o seguinte Código de Verificação para concluir o processo de redefinição de senha:\n\nCódigo de Verificação: ${tokenSenha}\n\nPor favor, copie e cole o Código de Verificação no campo 'Código de Verificação' na plataforma Automatiza AI.\n\nSe você não solicitou esta redefinição de senha, por favor, ignore este e-mail.\n\n\nAtenciosamente,\nEquipe Automatiza AI`
                };
                const info = await transporter.sendMail(mailOptions);
                console.log("E-mail enviado: " + info.response);
            }
            catch (error) {
                console.log(error);
            }
        }
        sendEmail();
    }
};
// Função para verificar se o email existe no banco de dados
const filterEmail = async (email) => {
    const sql = `SELECT * FROM "Users"  WHERE email ='${email}'`;
    const result = await database_1.default.query(sql, { type: sequelize_1.default.QueryTypes.SELECT });
    return { hasResult: result.length > 0, data: [result] };
};
const insertToken = async (email, tokenSenha) => {
    const sqls = `UPDATE "Users" SET "resetPassword"= '${tokenSenha}' WHERE email ='${email}'`;
    const results = await database_1.default.query(sqls, { type: sequelize_1.default.QueryTypes.UPDATE });
    return { hasResults: results.length > 0, datas: results };
};
exports.default = SendMail;
