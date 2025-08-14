import fs from "fs";
const cards = JSON.parse(fs.readFileSync("./config/cards.json", {
    encoding: "utf-8",
}));
const listen = JSON.parse(fs.readFileSync("./config/listen.json", {
    encoding: "utf-8",
}));
export const AllCards = cards;
export const PORT = listen.port || 4004;
export const AUTH_URL = listen.auth || "";
const SIGN_START_DAY = listen.sign_start_day;
export const Config = {
    AllCards,
    PORT,
    AUTH_URL,
    SIGN_START_DAY,
    DEV: process.env.NODE_ENV === "development",
};
