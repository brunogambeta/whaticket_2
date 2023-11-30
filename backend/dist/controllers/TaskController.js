"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const taskService_1 = __importDefault(require("../services/TaskService/taskService"));
const TaskController = {
    createTask: async (req, res) => {
        try {
            const { text, description } = req.body;
            const companyId = req.user.companyId;
            const task = await taskService_1.default.createTask(text, description, companyId);
            return res.status(201).json(task);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao criar a tarefa.' });
        }
    },
    getAllTasks: async (req, res) => {
        try {
            const companyId = req.user.companyId;
            const tasks = await taskService_1.default.getAllTasks(companyId);
            return res.status(200).json(tasks);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao buscar tarefas.' });
        }
    },
    getTaskById: async (req, res) => {
        try {
            const taskId = req.params.taskId;
            const companyId = req.user.companyId;
            const task = await taskService_1.default.getTaskById(taskId, companyId);
            if (!task) {
                return res.status(404).json({ error: 'Tarefa não encontrada.' });
            }
            return res.status(200).json(task);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao buscar a tarefa.' });
        }
    },
    updateTask: async (req, res) => {
        try {
            const taskId = req.params.taskId;
            const { text } = req.body;
            const companyId = req.user.companyId;
            const updatedTask = await taskService_1.default.updateTask(taskId, text, companyId);
            if (!updatedTask) {
                return res.status(404).json({ error: 'Tarefa não encontrada.' });
            }
            return res.status(200).json(updatedTask);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao atualizar a tarefa.' });
        }
    },
    deleteTask: async (req, res) => {
        try {
            const taskId = req.params.taskId;
            const companyId = req.user.companyId;
            const deletedTask = await taskService_1.default.deleteTask(taskId, companyId);
            if (!deletedTask) {
                return res.status(404).json({ error: 'Tarefa não encontrada.' });
            }
            return res.status(204).send();
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao excluir a tarefa.' });
        }
    },
    updateTaskDescription: async (req, res) => {
        try {
            const taskId = req.params.taskId;
            const { description } = req.body;
            const companyId = req.user.companyId;
            const updatedTask = await taskService_1.default.updateTaskDescription(taskId, description, companyId);
            if (!updatedTask) {
                return res.status(404).json({ error: 'Tarefa não encontrada.' });
            }
            return res.status(200).json({ message: 'Descrição da tarefa atualizada com sucesso' });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao atualizar a descrição da tarefa.' });
        }
    },
};
exports.default = TaskController;
