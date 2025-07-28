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
      alias: "aq1",
      src: "/cards/aq1.webp",
    },
    {
      alias: "aqjc",
      src: "/cards/aqjc.webp",
    },
    {
      alias: "bdsj",
      src: "/cards/bdsj.webp",
    },
    {
      alias: "dw",
      src: "/cards/dw.webp",
    },
    {
      alias: "dyyj",
      src: "/cards/dyyj.webp",
    },
    {
      alias: "eygg",
      src: "/cards/eygg.webp",
    },
    {
      alias: "ldxf",
      src: "/cards/ldxf.webp",
    },
    {
      alias: "px1",
      src: "/cards/px1.webp",
    },
    {
      alias: "qbfx",
      src: "/cards/qbfx.webp",
    },
    {
      alias: "ruokouling",
      src: "/cards/ruokouling.webp",
    },
    {
      alias: "up_root",
      src: "/cards/up_root.webp",
    },
    {
      alias: "waf_update",
      src: "/cards/waf_update.webp",
    },
    {
      alias: "waf",
      src: "/cards/waf.webp",
    },
    {
      alias: "xss",
      src: "/cards/xss.webp",
    },
    {
      alias: "sql_inject",
      src: "/cards/sql_inject.webp",
    },
    {
      alias: "card_back",
      src: "/assets/card_back.webp",
    },
    {
      alias: "user_ico",
      src: "/assets/user_ico.webp",
    },
    {
      alias: "health_bg",
      src: "/assets/health.webp",
    },
    {
      alias: "active-bg",
      src: "/assets/active-bg.webp",
    },
    {
      alias: "light",
      src: "/assets/light.webp",
    },
    {
      alias: "move_light",
      src: "/assets/move_light.webp",
    },
    {
      alias: "boom",
      src: "/assets/boom.webp",
    },
    {
      alias: "arrow",
      src: "/assets/arrow.webp",
    },
    {
      alias: "arrow_1",
      src: "/assets/arrow_1.webp",
    },
    {
      alias: "p1turn",
      src: "/assets/p1turn.webp",
    },
    {
      alias: "p2turn",
      src: "/assets/p2turn.webp",
    },
    {
      alias: "mlzy",
      src: "/cards/mlzy.webp",
    },
  ]);
}
