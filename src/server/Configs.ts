import type { CardData } from "../baseType/base";
import fs from "fs";
const cards = JSON.parse(
  fs.readFileSync(new URL("./cards.json", import.meta.url), "utf-8")
);

export const AllCards = cards as CardData[];
export const PORT = 4004;
export const Config = {
  AllCards,
  PORT,
};
