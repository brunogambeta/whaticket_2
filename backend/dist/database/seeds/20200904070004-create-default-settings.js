"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert("Settings", [
            {
                key: "userCreation",
                value: "enabled",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                key: "hoursCloseTicketsAuto",
                value: "9999999999",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                key: "chatBotType",
                value: "text",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                key: "userRandom",
                value: "enabled",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                key: "sendMsgTransfTicket",
                value: "enabled",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                key: "scheduleType",
                value: "enabled",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                key: "CheckMsgIsGroup",
                value: "enabled",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                key: "sendGreetingAccepted",
                value: "enabled",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                key: "acceptCallWhatsapp",
                value: "enabled",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                key: "userRating",
                value: "enabled",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                key: "sendGreetingMessageOneQueues",
                value: "enabled",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                key: "sendSignMessage",
                value: "enabled",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                key: "sendQueuePosition",
                value: "enabled",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                key: "acceptAudioMessageContact",
                value: "enabled",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                key: "sendFarewellWaitingTicket",
                value: "enabled",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                key: "ipixc",
                value: "",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                key: "tokenixc",
                value: "",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                key: "ipmkauth",
                value: "",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                key: "clientidmkauth",
                value: "",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                key: "clientsecretmkauth",
                value: "",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                key: "smtpauth",
                value: "",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                key: "usersmtpauth",
                value: "",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                key: "clientsecretsmtpauth",
                value: "",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                key: "asaas",
                value: "",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ], {});
    },
    down: (queryInterface) => {
        return queryInterface.bulkDelete("Settings", {});
    },
};
