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
exports.SendMail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const Setting_1 = __importDefault(require("../../models/Setting"));
const Email_1 = __importDefault(require("../../models/Email"));
const cron = __importStar(require("node-cron"));
const moment_1 = __importDefault(require("moment"));
// Função para enviar e-mails
const SendMail = async (companyId, email, tokenSenha, assunto, mensagem, sendAt, // Adicione sendAt como parâmetro
cronExpression) => {
    try {
        // Obtenha as configurações de SMTP do banco de dados
        const url = await Setting_1.default.findOne({
            where: {
                companyId,
                key: 'smtpauth',
            },
        });
        const user = await Setting_1.default.findOne({
            where: {
                companyId,
                key: 'usersmtpauth',
            },
        });
        const password = await Setting_1.default.findOne({
            where: {
                companyId,
                key: 'clientsecretsmtpauth',
            },
        });
        const urlSmtp = url.value;
        const userSmtp = user.value;
        const passwordSmtp = password.value;
        // Configurações para o serviço SMTP (use as configurações do seu provedor)
        const transporter = nodemailer_1.default.createTransport({
            host: urlSmtp,
            port: Number('587'),
            secure: false,
            auth: {
                user: userSmtp,
                pass: passwordSmtp, // Sua senha de e-mail
            },
        });
        // Função para enviar o e-mail
        async function sendEmail(formattedSendAt) {
            try {
                // Configurações do e-mail a ser enviado
                const mailOptions = {
                    from: userSmtp,
                    to: email,
                    subject: assunto,
                    text: mensagem, // Corpo do e-mail (texto)
                };
                // Enviar o e-mail
                await transporter.sendMail(mailOptions);
                // Salvar os dados do email no banco de dados, incluindo sendAt
                await Email_1.default.create({
                    sender: email,
                    subject: assunto,
                    message: mensagem,
                    companyId: companyId,
                });
                // Retornar uma mensagem de sucesso
                return { message: 'E-mail agendado e salvo com sucesso' };
            }
            catch (error) {
                console.error('Erro ao enviar e-mail:', error);
                throw new Error('Erro ao enviar e-mail: ' + error);
            }
        }
        // Agendar o envio do e-mail com base na expressão cron, se fornecida
        if (cronExpression) {
            cron.schedule(cronExpression, () => {
                const formattedSendAt = (0, moment_1.default)().add(1, 'hour').format('YYYY-MM-DDTHH:mm');
                sendEmail(formattedSendAt);
            });
            return { message: 'Agendamento de e-mail realizado com sucesso' };
        }
        else {
            // Se não houver expressão cron, envie imediatamente
            const formattedSendAt = (0, moment_1.default)().add(1, 'hour').format('YYYY-MM-DDTHH:mm');
            sendEmail(formattedSendAt);
            return { message: 'E-mail enviado imediatamente' };
        }
    }
    catch (error) {
        console.error('Erro ao agendar e-mail:', error);
        return { error: 'Erro ao agendar e-mail: ' + error.message };
    }
};
exports.SendMail = SendMail;
exports.default = exports.SendMail;
