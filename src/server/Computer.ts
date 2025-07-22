import { Connect } from "./Connect";
import { GameZoom, Player } from "./GameZoom";

export class Computer {
  id: string;
  zoom: GameZoom;
  constructor(id: string, game: GameZoom) {
    this.id = id;
    this.zoom = game;
    const p1 = game.player1;
    const p2 = game.player2;
    const curPlayer = id === p1.id ? p1 : p2;
    curPlayer.connect = new Connect({
      send: (data) => {
        this.action(data);
      },
      close: () => {},
    });
  }
  action(params: string) {
    const data = JSON.parse(params);
    const { type } = data || {};
    if (type === "turnStart") {
      this.randomPlayAttck();
    }
  }
  randomPlayAttck() {}
  static randomId() {
    return "pc_" + Date.now() + "";
  }
}
