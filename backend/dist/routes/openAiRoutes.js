"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const openAiRoutes = express_1.default.Router();
openAiRoutes.post('/openai', async (req, res) => {
    const { prompt } = req.body; // Assumindo que o prompt está sendo enviado no corpo da requisição
    try {
        const response = await (0, node_fetch_1.default)('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, // Garanta que esta é a chave correta
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
            }),
        });
        if (response.ok) {
            const data = await response.json();
            const answerText = data.choices[0].message.content;
            res.json({ answer: answerText });
        }
        else {
            console.error('Erro ao consultar a API da OpenAI');
            res.status(response.status).json({ error: 'Erro ao consultar a API da OpenAI' });
        }
    }
    catch (error) {
        console.error('Erro ao consultar a API da OpenAI:', error);
        res.status(500).json({ error: 'Erro ao consultar a API da OpenAI' });
    }
});
exports.default = openAiRoutes;
