"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agendarEnvioEmail = exports.listarEmailsAgendados = exports.listarEmailsEnviados = exports.enviarEmail = void 0;
const EmailService_1 = require("../services/EmailService/EmailService");
const Email_1 = __importDefault(require("../models/Email"));
const moment_1 = __importDefault(require("moment"));
const node_cron_1 = __importDefault(require("node-cron"));
const sequelize_1 = require("sequelize");
const winston_1 = __importDefault(require("winston"));
// Configurar o logger
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} ${level}: ${message}`;
    })),
    transports: [
        new winston_1.default.transports.Console(),
    ],
});
// Função para enviar e-mails
const enviarEmail = async (req, res) => {
    try {
        // Obtenha o companyId do corpo da solicitação
        const companyId = req.user.companyId;
        // Extrair dados do corpo da requisição
        const { email, tokenSenha, assunto, mensagem } = req.body;
        // Defina a data de envio para uma hora no futuro usando 'moment'
        const sendAt = (0, moment_1.default)().add(1, 'hour').format('YYYY-MM-DDTHH:mm');
        // Chame a função SendMail do seu arquivo de serviço com o companyId como primeiro argumento
        const result = await (0, EmailService_1.SendMail)(companyId, email, tokenSenha, assunto, mensagem, sendAt);
        // Verifique se houve um erro na função SendMail
        if (result.error) {
            return res.status(500).json({ error: result.error });
        }
        res.status(200).json({ message: 'E-mail enviado com sucesso' });
    }
    catch (error) {
        // Se ocorrer um erro, responder com um status de erro
        console.error('Erro ao enviar e-mail:', error);
        res.status(500).json({ error: 'Erro ao enviar e-mail' });
    }
};
exports.enviarEmail = enviarEmail;
// Função para listar os e-mails enviados
const listarEmailsEnviados = async (req, res) => {
    try {
        // Obtenha os e-mails enviados do banco de dados onde scheduled e sendAt são nulos
        const emailsEnviados = await Email_1.default.findAll({
            where: {
                companyId: req.user.companyId,
                scheduled: null,
                sendAt: null,
            },
        });
        // Responda com os e-mails enviados
        res.status(200).json(emailsEnviados);
    }
    catch (error) {
        // Se ocorrer um erro, responda com um status de erro
        console.error('Erro ao listar e-mails enviados:', error);
        res.status(500).json({ error: 'Erro ao listar e-mails enviados' });
    }
};
exports.listarEmailsEnviados = listarEmailsEnviados;
const listarEmailsAgendados = async (req, res) => {
    try {
        // Obtenha os e-mails agendados do banco de dados onde scheduled é verdadeiro
        const emailsAgendados = await Email_1.default.findAll({
            where: {
                companyId: req.user.companyId,
                scheduled: true,
                sendAt: {
                    [sequelize_1.Op.not]: null, // Certifique-se de que o campo sendAt não seja nulo
                },
            },
        });
        // Responda com os e-mails agendados
        res.status(200).json(emailsAgendados);
    }
    catch (error) {
        // Se ocorrer um erro, responda com um status de erro
        console.error('Erro ao listar e-mails agendados:', error);
        res.status(500).json({ error: 'Erro ao listar e-mails agendados' });
    }
};
exports.listarEmailsAgendados = listarEmailsAgendados;
// Função para agendar o envio de e-mail
const agendarEnvioEmail = async (req, res) => {
    try {
        // Obtenha o companyId do corpo da solicitação
        const companyId = req.user.companyId;
        // Extrair dados do corpo da requisição
        const { recipient, subject, message, sendAt } = req.body;
        // Verifique se a data de envio está no futuro
        const sendAtDate = new Date(sendAt);
        if (sendAtDate <= new Date()) {
            return res.status(400).json({ error: 'A data de envio deve ser no futuro' });
        }
        // Salvar os dados do agendamento no banco de dados
        await Email_1.default.create({
            sender: req.body.email,
            subject: req.body.assunto,
            message: req.body.mensagem,
            companyId: companyId,
            scheduled: true,
            sendAt: new Date(sendAt), // Salvar sendAt como uma data
        });
        res.status(200).json({ message: 'E-mail agendado com sucesso' });
    }
    catch (error) {
        // Se ocorrer um erro, responder com um status de erro
        console.error('Erro ao agendar o envio de e-mail:', error);
        res.status(500).json({ error: 'Erro ao agendar o envio de e-mail' });
    }
};
exports.agendarEnvioEmail = agendarEnvioEmail;
const enviarAgendamentosPendentes = async () => {
    try {
        const now = (0, moment_1.default)(); // Obtém a data e hora atual
        // Consulta o banco de dados para obter os agendamentos pendentes
        const agendamentos = await Email_1.default.findAll({
            where: {
                scheduled: true,
                sendAt: {
                    [sequelize_1.Op.lte]: now.toDate(), // Encontre agendamentos com sendAt menor ou igual à data e hora atual
                },
            },
        });
        // Envia os e-mails para os agendamentos encontrados
        for (const agendamento of agendamentos) {
            const result = await (0, EmailService_1.SendMail)(agendamento.companyId, agendamento.sender, '', agendamento.subject, agendamento.message, agendamento.sendAt.toISOString(), '');
            if (!result.error) {
                // Marque o agendamento como enviado no banco de dados
                await agendamento.update({ scheduled: false });
                // Adicione um log de sucesso ao console
                logger.info(`E-mail agendado enviado com sucesso para: ${agendamento.sender}`);
            }
            else {
                // Adicione um log de erro ao console
                logger.error(`Erro ao enviar e-mail agendado para: ${agendamento.sender}, erro: ${result.error}`);
            }
        }
    }
    catch (error) {
        // Adicione um log de erro ao console
        logger.error('Erro ao enviar agendamentos pendentes:', error);
    }
};
// Agende a função para ser executada a cada 30 segundos
node_cron_1.default.schedule('*/30 * * * * *', enviarAgendamentosPendentes);
