import { Assets, Container, Graphics, Sprite, Text } from "pixi.js";
import { Card } from "./Card";
import { GameManager } from "./GameManager";
import gsap from "gsap";
import type { DefenseCardData } from "../../baseType/base";

export class Emj extends Container {
  boom1Container: Container;
  boom2Container: Container;
  constructor() {
    super();
    this.boom1Container = new Container();
    this.boom2Container = new Container();
    this.addChild(this.boom1Container, this.boom2Container);
    this.showBoom1();
    this.showBoom2();
  }

  showBoom1() {
    if (this.boom1Container.children.length > 0) return;
    const boom1 = new Sprite(Assets.get("boom1"));
    boom1.width = 40;
    boom1.height = (40 * boom1.texture.height) / boom1.texture.width;
    const app = GameManager.getInstance().app;
    const vw100 = app?.screen.width || 0;
    const vh100 = app?.screen.height || 0;
    this.boom1Container.addChild(boom1);
    boom1.x = vw100 / 2 - boom1.width / 2;
    boom1.y = vh100 - 250;
    const from = { x: boom1.x, y: boom1.y };
    const to = { x: boom1.x, y: 140 };
    const cp = { x: boom1.x - 20, y: (from.y + to.y) / 2 };
    gsap.to(boom1, {
      duration: 1,
      motionPath: {
        path: [from, cp, to], // 贝塞尔路径：起点-控制点-终点
        curviness: 2,
      },
      // repeat: 100,
      onComplete: () => {
        this.boom1Container.removeChild(boom1);
      },
    });
  }
  showBoom2() {
    if (this.boom2Container.children.length > 0) return;
    const boom1 = new Sprite(Assets.get("boom1"));
    boom1.width = 40;
    boom1.height = (40 * boom1.texture.height) / boom1.texture.width;
    const app = GameManager.getInstance().app;
    const vw100 = app?.screen.width || 0;
    const vh100 = app?.screen.height || 0;
    this.boom2Container.addChild(boom1);
    const from = { x: vw100 / 2 - boom1.width / 2 + 10, y: 140 };
    const to = { x: vw100 / 2 - boom1.width / 2 + 10, y: vh100 - 260 };
    boom1.x = from.x;
    boom1.y = from.y;
    const cp = { x: boom1.x + 40, y: (from.y + to.y) / 2 };
    gsap.to(boom1, {
      duration: 1,
      motionPath: {
        path: [from, cp, to], // 贝塞尔路径：起点-控制点-终点
        curviness: 2,
      },
      // repeat: 100,
      onComplete: () => {
        this.boom2Container.removeChild(boom1);
      },
    });
  }
}
