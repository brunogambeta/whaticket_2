"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const calendarController_1 = require("../controllers/calendarController"); // Importe as funções de controller correspondentes
const isAuth_1 = __importDefault(require("../middleware/isAuth")); // Importe o middleware de autenticação
const calendarRoutes = express_1.default.Router();
// Rota para criar um novo evento
calendarRoutes.post('/eventos', isAuth_1.default, calendarController_1.criarEvento);
// Rota para listar todos os eventos
calendarRoutes.get('/eventos', isAuth_1.default, calendarController_1.listarEventos);
// Rota para marcar um evento como concluído
calendarRoutes.put('/eventos/:id/concluido', isAuth_1.default, calendarController_1.marcarEventoConcluido);
exports.default = calendarRoutes;
