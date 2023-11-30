"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBackupDatabase = void 0;
const logger_1 = require("../utils/logger");
const execSync = require('child_process').execSync;
const runBackupDatabase = async () => {
    function timestamp() {
        var dataAtual = new Date();
        var dia = dataAtual.getDate().toString().padStart(2, '0');
        var mes = (dataAtual.getMonth() + 1).toString().padStart(2, '0');
        var ano = dataAtual.getFullYear();
        var horas = dataAtual.getHours().toString().padStart(2, '0');
        var minutos = dataAtual.getMinutes().toString().padStart(2, '0');
        var result = `${ano}-${mes}-${dia}-${horas}-${minutos}`;
        return result;
    }
    const nameDB = `${process.env.DB_NAME}-${timestamp()}.sql`;
    try {
        const stringBackup = `PGPASSWORD="${process.env.DB_PASS}" pg_dump -Fc -U ${process.env.DB_USER} -h localhost ${process.env.DB_NAME} > ${process.env.DB_BACKUP}/${nameDB}`;
        // console.log('backup', stringBackup);
        execSync(stringBackup);
        // DELETANDO REGISTROS COM MAIS DE 2 HORAS
        execSync(`find ${process.env.DB_BACKUP} -type f -mmin +360 -delete`);
        logger_1.logger.info('Feito Backup do banco de dados PostgreSQL');
    }
    catch (error) {
        logger_1.logger.info('Nao consegui efetuar o backup e upload do banco de dados!');
    }
};
exports.runBackupDatabase = runBackupDatabase;
