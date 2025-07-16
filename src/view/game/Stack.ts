import { Application, Assets, Container, Sprite, Text } from "pixi.js";

export class Stack extends Container {
  constructor(app: Application) {
    super();

    const stackSprite = new Sprite(Assets.get("stack"));
    const size = 70;
    stackSprite.width = size;
    stackSprite.height = size;

    const txtContainer = new Container();
    txtContainer.x = 28;
    txtContainer.y = 38;
    const txtSprite = new Text({
      text: "17",
      style: {
        fill: "#a78bfa",
        fontSize: 22,
      },
    });

    const txtSpritex = new Text({
      text: "x",
      style: {
        fill: "#a78bfa",
        fontSize: 16,
      },
    });
    txtSpritex.x = 20;
    txtSpritex.y = 42;
    txtContainer.addChild(txtSprite);

    this.addChild(stackSprite, txtContainer, txtSpritex);
  }
}
