import { Assets, Container, Graphics, Sprite, Text } from "pixi.js";
import gsap from "gsap";
import { GameManager } from "./GameManager";
import mitt from "mitt";
import axios from "axios";

export class Health extends Container {
  static width = 70;
  static height = 70;
  health: number = 0;
  defenseContainer: Container;
  txtContainer: Container;
  gaspAnimal?: any;
  dangerContainer: Container;
  boomContainer: Sprite;
  boomGasp?: any;
  bgContainer: Container;
  constructor() {
    super();
    const bgContainer = new Container();
    this.addChild(bgContainer);
    this.bgContainer = bgContainer;
    const bgSprite = new Sprite(Assets.get("user_ico"));
    bgSprite.width = Health.width;
    bgSprite.height = Health.height;
    const mask = new Graphics();
    mask.filletRect(0, 0, Health.width, Health.height, 10).fill("transparent");
    bgSprite.mask = mask;
    bgContainer.addChild(bgSprite, mask);

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

    this.defenseContainer = new Container();

    const light = new Sprite(Assets.get("light"));
    light.width = Health.width + 50;
    light.height = Health.height + 50;
    light.x = -28;
    light.y = -24;

    this.defenseContainer.addChild(light);

    const maveLight = new Sprite(Assets.get("move_light"));
    // maveLight.width = Health.width;
    maveLight.height = 30;
    maveLight.width = (30 * maveLight.texture.width) / maveLight.texture.height;
    maveLight.x = -48;
    maveLight.y = -30;
    // maveLight.y = 60;
    maveLight.angle = -2;

    const mask_ = new Graphics().circle(0, 0, 50).fill("red");
    maveLight.mask = mask_;
    mask_.x = 32;
    mask_.y = 36;
    this.defenseContainer.addChild(maveLight, mask_);
    // maveLight.y = -24;
    this.gaspAnimal = gsap
      .to(maveLight, {
        pixi: {
          y: 60,
        },
        duration: 1.5,
        repeat: Infinity,
      })
      .pause();
    this.defenseContainer.visible = false;
    this.addChild(this.defenseContainer);

    const boom = new Sprite(Assets.get("boom"));
    this.boomContainer = boom;
    this.boomContainer.visible = false;
    boom.anchor.set(0.5, 0.5);
    boom.width = 60;
    boom.height = 60;
    boom.x = 35;
    boom.y = 35;
    this.addChild(boom);
    // boom.scale.set(0.3);
    const boomTimeline = gsap
      .timeline({
        onComplete: () => {
          boom.visible = false;
          this.dangerContainer.removeChildren();
        },
      })
      .pause();
    this.boomGasp = boomTimeline;
    boomTimeline
      .to(boom, {
        pixi: {
          scale: 0.2,
        },
        duration: 0.3,
      })
      .to(boom, {
        pixi: {
          scale: 0.4,
        },
        duration: 0.3,
      })
      .to(boom, {
        pixi: {
          scale: 0.3,
        },
        duration: 0.3,
      });

    this.dangerContainer = new Container();

    this.addChild(this.dangerContainer);

    this.updateHealth(15);
    {
      this.interactive = true;
      //发送表情
      this.on("pointerdown", () => {
        axios.get("/api/emj");
      });
    }
  }

  async updateAvatar(img: string) {
    let avatar: any;
    try {
      avatar = await Assets.load(img);
    } catch {
      avatar = Assets.get("user_ico");
    }
    const bgSprite = new Sprite(avatar);
    bgSprite.width = Health.width;
    bgSprite.height = Health.height;
    const mask = new Graphics();
    mask.filletRect(0, 0, Health.width, Health.height, 10).fill("transparent");
    bgSprite.mask = mask;
    this.bgContainer.removeChildren();
    this.bgContainer.addChild(bgSprite, mask);
  }
  updateHealth(health: number) {
    const oldHealth = this.health;
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
    const danger = health - oldHealth;
    if (danger < 0) {
      this.dangerContainer.removeChildren();
      const dangerTxt = new Text({
        text: danger,
        style: {
          fill: "#be123c",
          fontSize: 30,
          fontWeight: "bold",
        },
      });
      this.dangerContainer.x = 18;
      this.dangerContainer.y = 14;
      this.dangerContainer.addChild(dangerTxt);
      this.showBoom();
    }
  }
  private showBoom() {
    this.boomContainer.visible = true;
    this.boomGasp?.restart();
  }
  showMoveLight() {
    this.defenseContainer.visible = true;
    this.gaspAnimal?.restart();
  }
  hideMoveLight() {
    this.defenseContainer.visible = false;
    this.gaspAnimal?.pause();
  }
}
