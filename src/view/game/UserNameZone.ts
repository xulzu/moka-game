import { Container, Graphics, Text } from "pixi.js";

export class UserNmaeZone extends Container {
  txtContainer: Container;
  constructor() {
    super();
    const grap = new Graphics().filletRect(0, 0, 65, 16, 8).fill("#06060659");
    this.txtContainer = new Container();
    const mask = grap.clone();
    this.txtContainer.mask = mask;
    this.addChild(grap, this.txtContainer, mask);
  }
  update(name: string) {
    this.txtContainer.removeChildren();
    const txt = new Text({
      text: name,
      style: {
        fontSize: 12,
        fill: "#fff",
        fontFamily: "SimSun",
      },
    });
    txt.anchor = 0.5;
    txt.x = this.width / 2;
    txt.y = this.height / 2;
    this.txtContainer.addChild(txt);
  }
}
