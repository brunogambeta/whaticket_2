"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// emailRoutes.js
const express_1 = __importDefault(require("express"));
const emailController_1 = require("../controllers/emailController"); // Importe a função para listar os e-mails enviados e a função para agendar o envio de e-mails
const isAuth_1 = __importDefault(require("../middleware/isAuth"));
const emailRoutes = express_1.default.Router();
// Rota para enviar e-mail
emailRoutes.post('/enviar-email', isAuth_1.default, emailController_1.enviarEmail);
// Rota para listar os e-mails enviados
emailRoutes.get('/listar-emails-enviados', isAuth_1.default, emailController_1.listarEmailsEnviados);
emailRoutes.get('/listar-emails-agendados', isAuth_1.default, emailController_1.listarEmailsAgendados);
// Rota para agendar o envio de e-mail
emailRoutes.post('/agendar-envio-email', isAuth_1.default, emailController_1.agendarEnvioEmail);
exports.default = emailRoutes;
