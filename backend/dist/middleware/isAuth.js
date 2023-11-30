"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = require("jsonwebtoken");
const AppError_1 = __importDefault(require("../errors/AppError"));
const auth_1 = __importDefault(require("../config/auth"));
const Company_1 = __importDefault(require("../models/Company"));
const useDate_1 = require("../utils/useDate");
const isAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const { returnDays } = (0, useDate_1.useDate)();
    if (!authHeader) {
        throw new AppError_1.default("ERR_SESSION_EXPIRED", 401);
    }
    const [, token] = authHeader.split(" ");
    try {
        const decoded = (0, jsonwebtoken_1.verify)(token, auth_1.default.secret);
        const { id, profile, companyId } = decoded;
        const company = await Company_1.default.findByPk(companyId);
        // if (company && !company.status) {
        //   throw new AppError(
        //     "Empresa inativa, entre em contato com o setor financeiro através do whatsapp ou e-mail",
        //     401
        //   );
        // }
        // if (company && company.dueDate !== null && company.dueDate !== "" /*&& companyId !== 1*/) {
        //   const diff = returnDays(company.dueDate)
        //   if (diff <= -1) {
        //     throw new AppError(
        //       "Seu plano expirou, entre em contato com o setor financeiro através do whatsapp ou e-mail",
        //       401
        //     );
        //   }
        // }
        req.user = {
            id,
            profile,
            companyId
        };
    }
    catch (err) {
        if (err.statusCode === 401) {
            throw new AppError_1.default(err.message, 401);
        }
        else {
            throw new AppError_1.default("Invalid token. We'll try to assign a new one on next request", 403);
        }
    }
    return next();
};
exports.default = isAuth;
