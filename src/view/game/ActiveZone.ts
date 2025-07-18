import { Assets, Container, Graphics, Sprite } from "pixi.js";

export class ActiveZone extends Container {
  static width = 250;
  constructor() {
    super();
    const bg = new Sprite(Assets.get("active-bg"));
    bg.setSize(ActiveZone.width, ActiveZone.width);
    this.addChild(bg);
    this.visible = false;
  }
  show() {
    this.visible = true;
  }
  hide() {
    this.visible = false;
  }
}
