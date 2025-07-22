import { Connect } from "./Connect";
import { GameZoom, Player } from "./GameZoom";

export class Computer {
  id: string;
  zoom: GameZoom | null;
  self: Player;
  zoomRole: 0 | 1;
  waitFinish?: any;
  constructor(id: string, game: GameZoom) {
    this.id = id;
    this.zoom = game;
    const p1 = game.player1;
    const p2 = game.player2;
    const curPlayer = id === p1.id ? p1 : p2;
    this.zoomRole = id === p1.id ? 0 : 1;
    this.self = curPlayer;
    curPlayer.connect = new Connect({
      send: (data) => {
        this.action(data);
      },
      close: () => {
        this.zoom = null;
      },
    });
  }
  async action(params: string) {
    const data = JSON.parse(params);
    const { type } = data || {};
    if (type === "cardStackNumUpdate") {
      await this.randomPlayAttck();
      setTimeout(() => {
        this.zoom?.turnEnd(this.zoomRole);
      }, 3000);
    } else if (type === "flushAttack") {
      this.waitFinish?.();
    }
  }
  async randomPlayAttck() {
    const getRandomAttack = () => {
      const attackIds = this.self.handCards
        .filter((item) => item.type === "attack")
        .map((item) => item.id);
      if (attackIds.length === 0) {
        return -1;
      }
      const idx = Math.floor(Math.random() * attackIds.length);
      return idx;
    };
    const id = getRandomAttack();
    if (id === -1) return;
    this.zoom?.playCard(this.zoomRole, id);

    await new Promise<void>((res) => {
      if (this.self.danger === -1) {
        res();
      } else {
        this.waitFinish = res;
      }
    });

    const id2 = getRandomAttack();
    if (id2 === -1) return;
    await new Promise<void>((res) => {
      setTimeout(() => {
        res();
      }, 2000);
    });
    this.zoom?.playCard(this.zoomRole, id2);
  }
  static randomId() {
    return "pc_" + Date.now() + "";
  }
}
