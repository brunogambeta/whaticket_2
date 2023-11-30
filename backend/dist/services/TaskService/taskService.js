"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Task_1 = __importDefault(require("../../models/Task"));
const TaskService = {
    createTask: async (text, description, companyId) => {
        try {
            const task = await Task_1.default.create({ text, description, companyId });
            return task;
        }
        catch (error) {
            console.error(error);
            throw new Error('Erro ao criar a tarefa.');
        }
    },
    getAllTasks: async (companyId) => {
        try {
            const tasks = await Task_1.default.findAll({
                where: { companyId },
            });
            return tasks;
        }
        catch (error) {
            console.error(error);
            throw new Error('Erro ao buscar tarefas.');
        }
    },
    getTaskById: async (taskId, companyId) => {
        try {
            const task = await Task_1.default.findByPk(taskId, {
                where: { companyId },
            });
            if (!task) {
                return null;
            }
            return task;
        }
        catch (error) {
            console.error(error);
            throw new Error('Erro ao buscar a tarefa.');
        }
    },
    updateTask: async (taskId, text, companyId) => {
        try {
            const task = await Task_1.default.findByPk(taskId, {
                where: { companyId },
            });
            if (!task) {
                return null;
            }
            if (text !== undefined) {
                task.text = text;
            }
            await task.save();
            return task;
        }
        catch (error) {
            console.error(error);
            throw new Error('Erro ao atualizar a tarefa.');
        }
    },
    deleteTask: async (taskId, companyId) => {
        try {
            const task = await Task_1.default.findByPk(taskId, {
                where: { companyId },
            });
            if (!task) {
                return false;
            }
            await task.destroy();
            return true;
        }
        catch (error) {
            console.error(error);
            throw new Error('Erro ao excluir a tarefa.');
        }
    },
    // Remova a função markTaskAsCompleted aqui
    // ...
    updateTaskDescription: async (taskId, description, companyId) => {
        try {
            const task = await Task_1.default.findByPk(taskId, {
                where: { companyId },
            });
            if (!task) {
                return null;
            }
            console.log("Descrição recebida:", description); // Log para verificar descrição recebida
            task.description = description;
            await task.save();
            console.log("Descrição após atualização:", task.description); // Log para verificar descrição após atualização
            return task;
        }
        catch (error) {
            console.error(error);
            throw new Error('Erro ao atualizar a descrição da tarefa.');
        }
    },
};
exports.default = TaskService;
