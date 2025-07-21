import { Application, Assets, Container, Sprite, Text } from "pixi.js";

export class Stack extends Container {
  txtContainer: Container;
  constructor() {
    super();

    const stackSprite = new Sprite(Assets.get("stack"));
    const size = 70;
    stackSprite.width = size;
    stackSprite.height = size;

    const txtContainer = new Container();
    this.txtContainer = txtContainer;
    txtContainer.x = 28;
    txtContainer.y = 38;

    const txtSpritex = new Text({
      text: "x",
      style: {
        fill: "#a78bfa",
        fontSize: 16,
      },
    });
    txtSpritex.x = 20;
    txtSpritex.y = 42;

    this.addChild(stackSprite, txtContainer, txtSpritex);
  }
  updateNum(num: number) {
    this.txtContainer.removeChildren();
    const txt = new Text({
      text: num,
      style: {
        fill: "#a78bfa",
        fontSize: 22,
      },
    });
    this.txtContainer.addChild(txt);
  }
}
