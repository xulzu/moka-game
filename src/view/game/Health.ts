import { Assets, Container, Graphics, Sprite, Text } from "pixi.js";
import gsap from "gsap";
import { GameManager } from "./GameManager";
import mitt from "mitt";

export class Health extends Container {
  static width = 70;
  static height = 70;
  health: number = 20;

  txtContainer: Container;
  constructor() {
    super();
    const bgSprite = new Sprite(Assets.get("user_ico"));
    bgSprite.width = Health.width;
    bgSprite.height = Health.height;
    const mask = new Graphics();
    mask.filletRect(0, 0, Health.width, Health.height, 10).fill("transparent");
    this.addChild(mask);
    this.addChild(bgSprite);
    bgSprite.mask = mask;
    const border = mask.clone();
    mask.stroke({
      width: 3,
      color: "#831843",
    });

    this.addChild(border);

    const heart = new Sprite(Assets.get("health_bg"));
    heart.width = 32;
    heart.height = 30;
    heart.x = 52;
    heart.y = -6;
    this.addChild(heart);

    this.txtContainer = new Container();
    this.txtContainer.x = 56;
    this.txtContainer.y = -6;
    this.addChild(this.txtContainer);

    this.updateHealth(9);
  }
  updateHealth(health: number) {
    this.health = health;
    this.txtContainer.removeChildren();
    const txt = new Text({
      text: health,
      style: {
        fill: "#ffffff",
        fontSize: 16,
        fontWeight: "bold",
      },
    });
    if (health > 10) {
      txt.x = 3;
      txt.y = 5;
    } else {
      txt.x = 8;
      txt.y = 5;
    }

    this.txtContainer.addChild(txt);
  }
}
