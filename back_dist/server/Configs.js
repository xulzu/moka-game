import fs from "fs";
const cards = JSON.parse(fs.readFileSync(new URL("./cards.json", import.meta.url), "utf-8"));
export const AllCards = cards;
export const PORT = 4004;
export const Config = {
    AllCards,
    PORT,
};
