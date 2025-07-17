import { Assets } from "pixi.js";

export async function loadAssets() {
  await Assets.load([
    {
      alias: "bg",
      src: "/assets/bg_blue.webp",
    },
    {
      alias: "selfTurn",
      src: "/assets/self_turn.webp",
    },
    {
      alias: "time",
      src: "/assets/time.png",
    },
    {
      alias: "stack",
      src: "/assets/stack.webp",
    },
    {
      alias: "card_name",
      src: "/assets/card_name_bg.webp",
    },
    {
      alias: "card_num",
      src: "/assets/card_num.webp",
    },
    {
      alias: "sql",
      src: "/cards/sql_inject.webp",
    },
  ]);
}
