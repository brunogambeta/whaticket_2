"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const TaskController_1 = __importDefault(require("../controllers/TaskController"));
const isAuth_1 = __importDefault(require("../middleware/isAuth"));
const router = express_1.default.Router();
router.post('/tasks', isAuth_1.default, TaskController_1.default.createTask);
router.get('/tasks', isAuth_1.default, TaskController_1.default.getAllTasks);
router.get('/tasks/:taskId', isAuth_1.default, TaskController_1.default.getTaskById);
router.put('/tasks/:taskId', isAuth_1.default, TaskController_1.default.updateTask);
router.delete('/tasks/:taskId', isAuth_1.default, TaskController_1.default.deleteTask);
router.put('/tasks/:taskId/description', isAuth_1.default, TaskController_1.default.updateTaskDescription);
exports.default = router;
