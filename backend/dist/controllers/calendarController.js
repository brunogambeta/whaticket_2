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
Object.defineProperty(exports, "__esModule", { value: true });
exports.marcarEventoConcluido = exports.listarEventos = exports.criarEvento = void 0;
const eventService = __importStar(require("../services/eventService/eventService"));
// Função para criar um novo evento
const criarEvento = async (req, res) => {
    try {
        const novoEvento = await eventService.criarEvento(req.body);
        res.status(201).json(novoEvento);
    }
    catch (error) {
        res.status(500).json({ message: 'Erro ao criar evento: ' + error.message });
    }
};
exports.criarEvento = criarEvento;
// Função para listar todos os eventos
const listarEventos = async (req, res) => {
    try {
        const eventos = await eventService.listarEventos();
        res.json(eventos);
    }
    catch (error) {
        res.status(500).json({ message: 'Erro ao listar eventos: ' + error.message });
    }
};
exports.listarEventos = listarEventos;
// Função para marcar um evento como concluído
const marcarEventoConcluido = async (req, res) => {
    const eventoId = req.params.id;
    try {
        const evento = await eventService.marcarEventoConcluido(eventoId);
        if (!evento) {
            return res.status(404).json({ message: 'Evento não encontrado' });
        }
        res.json(evento);
    }
    catch (error) {
        res.status(500).json({ message: 'Erro ao marcar evento como concluído: ' + error.message });
    }
};
exports.marcarEventoConcluido = marcarEventoConcluido;
