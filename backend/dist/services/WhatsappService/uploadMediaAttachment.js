"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMedia = exports.mediaUpload = exports.normalizeName = void 0;
const lodash_1 = require("lodash");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const Whatsapp_1 = __importDefault(require("../../models/Whatsapp"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const upload_1 = require("../../config/upload");
const normalizeName = (inputString) => {
    let cleanString = inputString.replace(/[^\w\s.]/g, '');
    let words = cleanString.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
        words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
    }
    let resultString = words.join('');
    return resultString;
};
exports.normalizeName = normalizeName;
const mediaUpload = async (req, res) => {
    const { whatsappId } = req.params;
    const files = req.files;
    const file = (0, lodash_1.head)(files);
    try {
        const whatsapp = await Whatsapp_1.default.findByPk(whatsappId);
        let greetingMediaAttachmentTmp = [];
        const invalidOptions = [null, undefined, "", 'null', 'undefined', " "];
        if (invalidOptions.includes(whatsapp.greetingMediaAttachment)) {
            greetingMediaAttachmentTmp = [];
        }
        else {
            try {
                greetingMediaAttachmentTmp = JSON.parse(whatsapp.greetingMediaAttachment);
            }
            catch (error) {
                greetingMediaAttachmentTmp = [whatsapp.greetingMediaAttachment];
            }
        }
        if (greetingMediaAttachmentTmp instanceof Array === false) {
            greetingMediaAttachmentTmp = [greetingMediaAttachmentTmp];
        }
        let toRemove = [];
        for (const fFile of greetingMediaAttachmentTmp) {
            if (file.filename.includes(fFile)) {
                console.log('includes', fFile, 'in', file.filename);
                toRemove.push(fFile);
            }
            else {
                console.log('not includes', fFile, 'in', file.filename);
            }
        }
        console.log('toRemove', toRemove);
        for (const fFile of toRemove) {
            greetingMediaAttachmentTmp.splice(greetingMediaAttachmentTmp.indexOf(fFile), 1);
        }
        const oldName = file.filename;
        const newName = (0, exports.normalizeName)(file.filename);
        file.filename = newName;
        const path = `${upload_1.publicFolder}/company${whatsapp.companyId}/${oldName}`;
        if (fs_1.default.existsSync(path)) {
            fs_1.default.renameSync(path, `${upload_1.publicFolder}/company${whatsapp.companyId}/${newName}`);
        }
        greetingMediaAttachmentTmp.push(file.filename);
        toRemove = [];
        for (const fFile of greetingMediaAttachmentTmp) {
            const path = `${upload_1.publicFolder}/company${whatsapp.companyId}/`;
            if (!fs_1.default.existsSync(path)) {
                toRemove.push(fFile);
            }
        }
        for (const fFile of toRemove) {
            greetingMediaAttachmentTmp.splice(greetingMediaAttachmentTmp.indexOf(fFile), 1);
        }
        whatsapp.greetingMediaAttachment = JSON.stringify(greetingMediaAttachmentTmp);
        await whatsapp.save();
        return res.status(200).json({ mensagem: "Arquivo adicionado!" });
    }
    catch (err) {
        throw new AppError_1.default(err.message);
    }
};
exports.mediaUpload = mediaUpload;
const deleteMedia = async (req, res) => {
    const { whatsappId } = req.params;
    try {
        const whatsapp = await Whatsapp_1.default.findByPk(whatsappId);
        const filePath = path_1.default.resolve("public", whatsapp.greetingMediaAttachment);
        const fileExists = fs_1.default.existsSync(filePath);
        if (fileExists) {
            fs_1.default.unlinkSync(filePath);
        }
        whatsapp.greetingMediaAttachment = null;
        await whatsapp.save();
        return res.send({ message: "Arquivo excluído" });
    }
    catch (err) {
        throw new AppError_1.default(err.message);
    }
};
exports.deleteMedia = deleteMedia;
