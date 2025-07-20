import {
  Assets,
  Container,
  FillGradient,
  Graphics,
  Sprite,
  Text,
} from "pixi.js";
import type { AttackCardData } from "../../baseType/base";
import { Card } from "./Card";
import { GameManager } from "./GameManager";

export class WaitDefenseZone extends Container {
  attackId?: number;
  vw: number;
  vh: number;
  content: Container;
  cardContainer: Container;

  skipContainer: Container;
  titleContainer: Container;
  processFrames: Graphics;
  processGasp?: any;

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
    const bar0 = new Graphics().filletRect(0, 0, 200, 6, 4).fill("#9d7f62");
    bar0.x = (gra.width - bar0.width) / 2;
    bar0.y = gra.height - 14;
    this.processBar = {
      x: bar0.x,
      y: bar0.y,
      total: bar0.width,
    };
    const gradient1 = new FillGradient({
      end: { x: 1, y: 0 },
      colorStops: [
        { offset: 0, color: "#ee7e11" },
        { offset: 1, color: "#ffd46d" },
      ],
    });
    const bar1 = new Graphics().filletRect(0, 0, 100, 6, 4).fill(gradient1);
    bar1.x = bar0.x;
    bar1.y = bar0.y;
    this.processObj = bar1;
    //skep
    const skepTxt = new Text({
      text: "跳过 >>",
      style: {
        fontSize: 12,
        fill: "#ffd46d",
      },
    });
    skepTxt.y = bar0.y - 5;
    skepTxt.x = bar0.x + bar0.width + 20;
    this.skipContainer = skepTxt;
    const top = new Container();
    top.y = 12;
    const arrow = new Sprite(Assets.get("arrow"));

    arrow.setSize(20, 10);
    arrow.y = 6;
    const topTxt = new Container();
    this.titleContainer = topTxt;
    topTxt.x = 24;
    const info = new Text({
      text: "我方进行防御",
      style: {
        fontSize: 20,
        fill: "#fff",
        fontFamily: "SimSun",
      },
    });
    topTxt.addChild(info);
    top.addChild(arrow, topTxt);
    top.x = (gra.width - top.width) / 2;

    tipsCont.addChild(gra, bar0, bar1, skepTxt, top);
    this.addChild(tipsCont);
    tipsCont.x = (this.vw - tipsCont.width) / 2;
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
        this.processGasp = gsap.to(
          { x: this.processBar.total },
          {
            x: 0,
            duration: time,
            onUpdate: (value) => {
              console.log(value);
              const valeInt = Math.floor(value);
              this.processObj.clear;
            },
          }
        );
      }
    } else {
      this.visible = false;
    }
  }
}
