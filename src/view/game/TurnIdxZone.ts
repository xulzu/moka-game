import {
  Application,
  Assets,
  Container,
  Graphics,
  Sprite,
  Text,
} from "pixi.js";
import mitt from "mitt";
import axios from "axios";
import { GameManager } from "./GameManager";
import gsap from "gsap";
//回合指示区
export class TurnIdxZone extends Container {
  static width = 75;

  emitter = mitt<{
    toggle: boolean; // true切换到自己的回合 false切换到对方的回合
    updateTime: number;
    finish: void;
  }>();
  time = 0;
  self = true;
  p1: Sprite;
  p2: Sprite;
  constructor() {
    super();

    const p1 = new Sprite(Assets.get("p1turn"));
    const h = 24;
    p1.height = h;
    p1.width = (h * p1.texture.width) / p1.texture.height;
    const p2 = new Sprite(Assets.get("p2turn"));
    p2.height = h;
    p2.width = (h * p2.texture.width) / p2.texture.height;
    this.addChild(p1, p2);
    p2.visible = false;
    this.p1 = p1;
    this.p2 = p2;
    this.visible = false;

    // this.toggle(true);
  }
  toggle(self: boolean) {
    this.self = self;
    this.emitter.emit("toggle", self);
    this.alpha = 0;
    this.visible = true;
    this.p1.visible = self;
    this.p2.visible = !self;
    gsap.to(this, {
      pixi: {
        alpha: 1,
      },
      duration: 0.5,
      onComplete: () => {
        setTimeout(() => {
          this.visible = false;
        }, 1000);
      },
    });
  }
  updateTime(time: number) {
    this.time = time;
    this.emitter.emit("updateTime", time);
  }
  finish() {
    if (this.self) {
      axios.get("/api/turnEnd");
    }
  }
}
