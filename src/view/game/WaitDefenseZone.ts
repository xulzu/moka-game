import { Container, Graphics, Text } from "pixi.js";
import type { AttackCardData } from "../../baseType/base";
import { Card } from "./Card";

export class WaitDefenseZone extends Container {
  private width_ = 100;
  private height_ = 130;
  attackZone: Container;
  optZone: Container;
  attackId?: number;
  constructor(x: number, y: number) {
    super();
    this.x = x;
    this.y = y;
    const rect = new Graphics();
    rect
      .rect(0, 0, this.width_, this.height_)
      .stroke({
        width: 1,
        color: "black",
      })
      .fill("#166534");
    this.addChild(rect);
    this.attackZone = new Container();
    this.optZone = new Container();
    this.addChild(this.attackZone, this.optZone);
  }
  updateTime(self: boolean, time: number, cardData: AttackCardData) {
    if (time) {
      this.visible = true;
      if (this.attackId !== cardData.id) {
        this.attackZone.removeChildren();
        this.attackId = cardData.id;
        const newCard = new Card(0, 0, cardData);
        this.attackZone.addChild(newCard);
      }
      this.optZone.removeChildren();

      this.optZone.addChild(
        new Text({
          text: (self ? "打出防御卡进行防御" : "等待对方打出防御卡") + time,
          x: 5,
          y: 5,
          style: {
            fontSize: 12,
            fontFamily: "Arial",
            fill: "blue",
            align: "center",
          },
        })
      );
      if (self) {
        this.optZone.addChild(
          new Text({
            text: "skip",
            x: 45,
            y: 5,
            style: {
              fontSize: 12,
              fontFamily: "Arial",
              fill: "blue",
              align: "center",
            },
          })
        );
      }
    } else {
      this.visible = false;
    }
  }
}
