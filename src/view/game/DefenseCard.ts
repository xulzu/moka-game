import { Container, Graphics, Text } from "pixi.js";
import { Card } from "./Card";
import { GameManager } from "./GameManager";
import gsap from "gsap";
import type { DefenseCardData } from "../../baseType/base";

export class DefenseCard extends Container {
  private preTag = false;
  private highlightBorder: Graphics;
  private emptyContent: Container;
  private cardContent: Container;
  private width_ = 100;
  private height_ = 130;
  id: 0 | 1 | 2 | 3;
  isEmpty = true;
  defenseData?: DefenseCardData;

  constructor(x: number, y: number, id: 0 | 1 | 2 | 3) {
    super();
    this.id = id;
    this.x = x;
    this.y = y;
    this.emptyContent = new Container();
    this.cardContent = new Container();
    this.highlightBorder = new Graphics();
    this.highlightBorder.visible = false;

    const rect = new Graphics();
    rect
      .rect(0, 0, this.width_, this.height_)
      .stroke({
        width: 1,
        color: "black",
      })
      .fill("#166534");

    this.addChild(rect);
    this.addChild(this.emptyContent);
    this.addChild(this.cardContent);
    this.addChild(this.highlightBorder); //放到最后
    this.highlightBorder.rect(0, 0, this.width_, this.height_).stroke({
      width: 2,
      color: "yellow",
    });

    this.emptyContent.addChild(
      new Text({
        text: "防御区",
        x: 30,
        y: 30,
        style: {
          fontSize: 12,
          fontFamily: "Arial",
          fill: "blue",
          align: "center",
        },
      })
    );
  }

  highlight(on: boolean) {
    if (on === this.preTag) {
      return;
    }
    this.preTag = on;
    this.highlightBorder!.visible = on;
  }
  private drawEmpty() {
    this.isEmpty = true;
    this.cardContent.visible = false;
    this.emptyContent.visible = true;
  }
  private drawCard(data: DefenseCardData) {
    this.emptyContent.visible = false;
    this.cardContent.visible = true;
    const defenseData = data;
    this.cardContent.removeChildren();
    this.cardContent.addChild(
      new Text({
        text: `防御力: ${defenseData.defense} 生命值: ${defenseData.health}`,
        x: 5,
        y: 30,
        style: {
          fontSize: 12,
          fontFamily: "Arial",
          fill: "blue",
          align: "center",
        },
      })
    );
  }
  // 将防御卡放在当前防御区
  activeZone(card: DefenseCardData) {
    this.isEmpty = false;
    this.defenseData = card;
    this.drawCard(this.defenseData);
  }

  attacked(lastHealth: number) {
    if (this.isEmpty) {
      return;
    }
    this.defenseData!.health = lastHealth;
    if (this.defenseData!.health <= 0) {
      this.drawEmpty();
    } else {
      this.drawCard(this.defenseData!);
    }
    this.addHealthChangeAnimation();
  }
  private addHealthChangeAnimation() {
    // 简单的缩放动画
    this.scale.set(1.2);
    gsap.to(this, {
      pixi: {
        scale: 1,
      },
      duration: 0.2,
    });
  }
}
