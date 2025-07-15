import { Container } from "pixi.js";
import mitt from "mitt";
//回合指示区
export class TurnIdxZone {
  emitter = mitt<{
    toggle: boolean; // true切换到自己的回合 false切换到对方的回合
    updateTime: number;
    finish: void;
  }>();

  constructor() {
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
