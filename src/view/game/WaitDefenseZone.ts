import {
  Assets,
  Container,
  FillGradient,
  Graphics,
  GraphicsContext,
  Sprite,
  Text,
} from "pixi.js";
import type { AttackCardData } from "../../baseType/base";
import { Card } from "./Card";
import { GameManager } from "./GameManager";
import gsap from "gsap";
import axios from "axios";
export class WaitDefenseZone extends Container {
  attackId?: number;
  vw: number;
  vh: number;
  content: Container;
  cardContainer: Container;

  skipContainer: Container;
  titleContainer: Container;
  processFrames: GraphicsContext[];
  processGasp?: any;
  processObj: Graphics;
  titleTxtContainer: Container;
  width_100: number = 0;
  height_100: number = 0;
  constructor() {
    super();
    this.cardContainer = new Container();
    this.addChild(this.cardContainer);
    const app = GameManager.getInstance().app;
    this.vw = app?.screen.width || 0;
    this.vh = app?.screen.height || 0;
    this.cardContainer.y = this.vh - 530;

    const tipsCont = new Container();
    this.content = tipsCont;

    tipsCont.y = this.vh - 300;

    const gradient = new FillGradient({
      end: { x: 1, y: 0 },
      colorStops: [
        { offset: 0, color: "#302f2f4d" },
        { offset: 0.25, color: "#1c1b1bb5" },
        { offset: 0.75, color: "#1c1b1bb5" },
        { offset: 1, color: "#302f2f4d" },
      ],
    });
    const gra = new Graphics().rect(0, 0, this.vw - 20, 60).fill(gradient);
    gra.alpha = 0.7;
    this.width_100 = gra.width;
    this.height_100 = gra.height;
    const bar0 = new Graphics().filletRect(0, 0, 200, 6, 4).fill("#9d7f62");
    bar0.x = (gra.width - bar0.width) / 2;
    bar0.y = gra.height - 14;
    const gradient1 = new FillGradient({
      end: { x: 1, y: 0 },
      colorStops: [
        { offset: 0, color: "#ee7e11" },
        { offset: 1, color: "#ffd46d" },
      ],
    });
    //进度条帧
    const step = 1;
    this.processFrames = new Array(100 / step).fill(0).map((_, i) => {
      return new GraphicsContext()
        .filletRect(0, 0, i * step * 0.01 * 200, 6, 4)
        .fill(gradient1);
    });
    const bar1 = new Graphics();
    bar1.x = bar0.x;
    bar1.y = bar0.y;
    this.processObj = bar1;
    //skep
    this.skipContainer = new Container();
    const skepTxt = new Text({
      text: "跳过 >>",
      style: {
        fontSize: 12,
        fill: "#ffd46d",
      },
    });
    skepTxt.y = bar0.y - 5;
    skepTxt.x = bar0.x + bar0.width + 20;

    this.skipContainer.addChild(skepTxt);
    this.skipContainer.interactive = true;
    this.skipContainer.on("pointerdown", () => {
      this.skip();
    });

    const top = new Container();
    this.titleContainer = top;
    top.y = 12;
    const arrow = new Sprite(Assets.get("arrow"));
    arrow.label = "arrow";
    arrow.setSize(20, 10);
    arrow.y = 6;
    const topTxt = new Container();
    this.titleTxtContainer = topTxt;
    topTxt.x = 24;
    top.addChild(arrow, topTxt);

    tipsCont.addChild(gra, bar0, bar1, this.skipContainer, top);
    this.addChild(tipsCont);
    tipsCont.x = (this.vw - tipsCont.width) / 2;
    this.visible = false;
  }
  updateTime(self: boolean, time: number, cardData: AttackCardData) {
    if (time) {
      this.visible = true;
      // 卡片区更新
      if (this.attackId !== cardData.id) {
        this.processGasp?.kill();
        this.processGasp = void 0;
        this.attackId = cardData.id;
        const card = new Card(0, 0, cardData);
        card.pivot.set(0, 0);
        const w = 150;
        card.setSize(w, w * (Card.height / Card.width));
        card.x = (this.vw - 150) / 2;
        this.cardContainer.addChild(card);
      }

      //skip区更新
      this.skipContainer.visible = self;

      //进度条更新
      if (!this.processGasp) {
        const target = { x: time };
        this.processGasp = gsap.to(target, {
          x: 0,
          duration: time,
          ease: "linear",
          onUpdate: () => {
            const idx = Math.floor((target.x / time) * 100);
            this.processObj.context = this.processFrames[idx];
          },
        });
      }
      //文本更新
      this.titleTxtContainer.removeChildren();
      const info = new Text({
        text: self ? "双击或拖动蓝色防御卡防御" : "对方进行防御",
        style: {
          fontSize: 20,
          fill: "#fff",
          fontFamily: "SimSun",
        },
      });
      this.titleTxtContainer.addChild(info);
      this.titleContainer.x = (this.width_100 - this.titleContainer.width) / 2;
    } else {
      this.visible = false;
    }
  }
  skip() {
    axios.get("/api/skipDefenseCard");
  }
}
