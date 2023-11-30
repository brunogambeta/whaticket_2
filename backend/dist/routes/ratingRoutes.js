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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const isAuth_1 = __importDefault(require("../middleware/isAuth"));
const RatingController = __importStar(require("../controllers/RatingController"));
const ratingRoutes = express_1.default.Router();
ratingRoutes.get("/ratings/list", isAuth_1.default, RatingController.list);
ratingRoutes.get("/ratings", isAuth_1.default, RatingController.index);
ratingRoutes.post("/ratings", isAuth_1.default, RatingController.store);
ratingRoutes.put("/ratings/:ratingId", isAuth_1.default, RatingController.update);
ratingRoutes.get("/ratings/:ratingId", isAuth_1.default, RatingController.show);
ratingRoutes.delete("/ratings/:ratingId", isAuth_1.default, RatingController.remove);
ratingRoutes.delete("/ratings", isAuth_1.default, RatingController.removeAll);
ratingRoutes.post("/ratings/messages/:ticketId", isAuth_1.default, RatingController.sendRating);
exports.default = ratingRoutes;
