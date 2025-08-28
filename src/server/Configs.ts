import type { CardData } from "../baseType/base";
import fs from "fs";
const cards = JSON.parse(
  fs.readFileSync("./config/cards.json", {
    encoding: "utf-8",
  })
);
const listen = JSON.parse(
  fs.readFileSync("./config/config.json", {
    encoding: "utf-8",
  })
);
export const AllCards = cards as CardData[];
export const PORT = listen.port || 4004;
export const AUTH_URL = listen.auth || "";
const SIGN_START_DAY = listen.sign_start_day as string[];
export const Config = {
  AllCards,
  PORT,
  AUTH_URL,
  SIGN_START_DAY,
  DEV: process.env.NODE_ENV === "development",
  JWT_SECRET: listen.jwt_secret,
  ADMIN: listen.admin as string[],
};
