import {
  Application,
  Assets,
  Container,
  Graphics,
  Sprite,
  Text,
} from "pixi.js";
import mitt from "mitt";
//回合指示区
export class TurnIdxZone extends Container {
  static width = 75;
  emitter = mitt<{
    toggle: boolean; // true切换到自己的回合 false切换到对方的回合
    updateTime: number;
    finish: void;
  }>();
  txtContainer: Container;

  constructor() {
    super();
    const turnSprite = new Sprite(Assets.get("selfTurn"));
    const size = TurnIdxZone.width;
    turnSprite.width = size;
    turnSprite.height =
      size * (turnSprite.texture.height / turnSprite.texture.width);

    const timer = new Container();
    timer.x = turnSprite.x + 15;
    timer.y = turnSprite.y + turnSprite.height + 5;
    const graphics = new Graphics().filletRect(0, 0, 80, 20, 10).fill({
      color: "#1f2937",
      alpha: 0.5,
    });

    const timeSprite = new Sprite(Assets.get("time"));
    timeSprite.width = 16;
    timeSprite.height = 16;
    timeSprite.alpha = 0.8;
    timeSprite.x = 3;
    timeSprite.y = 2;
    const txtSprite = new Text({
      text: "90s",
      style: {
        fill: "#d1d5db",
        fontSize: 14,
      },
      anchor: {
        y: 0.5,
        x: 0,
      },
    });
    txtSprite.x = 24;
    txtSprite.y = 10;
    const txtContainer = new Container();
    txtContainer.addChild(txtSprite);
    timer.addChild(graphics, timeSprite, txtContainer);
    this.txtContainer = txtContainer;
    this.addChild(turnSprite, timer);
    this.emitter.on("finish", () => {
      // 结束自己的回合
      this.emitter.emit("toggle", false);
    });
  }
  toggle(self: boolean) {
    this.emitter.emit("toggle", self);
  }
  updateTime(time: number) {
    this.emitter.emit("updateTime", time);
  }
}
