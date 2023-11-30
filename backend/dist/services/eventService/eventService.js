"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.marcarEventoConcluido = exports.listarEventos = exports.criarEvento = void 0;
const evento_1 = __importDefault(require("../../models/evento")); // Importe o modelo de evento
// Função para criar um novo evento
async function criarEvento(eventoData) {
    try {
        const novoEvento = await evento_1.default.create(eventoData);
        return novoEvento;
    }
    catch (error) {
        throw new Error('Erro ao criar evento: ' + error.message);
    }
}
exports.criarEvento = criarEvento;
// Função para listar todos os eventos
async function listarEventos() {
    try {
        const eventos = await evento_1.default.findAll();
        return eventos;
    }
    catch (error) {
        throw new Error('Erro ao listar eventos: ' + error.message);
    }
}
exports.listarEventos = listarEventos;
// Função para marcar um evento como concluído
async function marcarEventoConcluido(eventoId) {
    try {
        const evento = await evento_1.default.findByPk(eventoId);
        if (!evento) {
            throw new Error('Evento não encontrado');
        }
        evento.concluido = true;
        await evento.save();
        return evento;
    }
    catch (error) {
        throw new Error('Erro ao marcar evento como concluído: ' + error.message);
    }
}
exports.marcarEventoConcluido = marcarEventoConcluido;
