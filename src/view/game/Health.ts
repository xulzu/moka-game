import { Graphics, Text } from "pixi.js";
import gsap from "gsap";
import { GameManager } from "./GameManager";
import mitt from "mitt";

export class Health {
  emitter = mitt<{
    updateHealth: { self: boolean; health: number };
  }>();
  updateHealth(self: boolean, health: number) {
    this.emitter.emit("updateHealth", { self, health });
  }
}
