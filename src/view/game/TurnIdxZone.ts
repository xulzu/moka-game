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
//回合指示区
export class TurnIdxZone {
  static width = 75;
  emitter = mitt<{
    toggle: boolean; // true切换到自己的回合 false切换到对方的回合
    updateTime: number;
    finish: void;
  }>();
  time = 0;
  self = true;
  toggle(self: boolean) {
    this.self = self;
    this.emitter.emit("toggle", self);
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
