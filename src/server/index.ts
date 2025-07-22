import Router from "@koa/router";
import { Connect } from "./Connect";
import { GameZoom, Player } from "./GameZoom";
import Koa from "koa";
type PendingResolve = (value: string) => void;
import cards from "./cards.json";
import type { CardData } from "../baseType/base";
import { Computer } from "./Computer";

class Game {
  queue: { user: string; resolve: PendingResolve }[] = [];
  private allZoom: Record<string, Player> = {};
  //等待匹配
  async pending(user: string, onQuit: (cb: () => void) => void) {
    const idx = this.queue.findIndex((item) => item.user === user);
    if (idx !== -1) {
      this.queue.splice(idx, 1);
    }
    let resolve_: (value: string) => void;
    const promise = new Promise<string>((resolve, reject) => {
      resolve_ = resolve;
    });
    let timer: any = void 0;
    if (this.queue.length) {
      const { user: p2, resolve: resolve_2 } = this.queue.shift()!;
      const game = this.createGame(user, p2);
      resolve_2?.(game.id);
      resolve_!(game.id);
    } else {
      this.queue.push({ user, resolve: resolve_! });
      timer = setTimeout(() => {
        const idx = this.queue.findIndex((item) => item.user === user);
        if (idx !== -1) {
          this.queue.splice(idx, 1);
          const computerClient = new Computer();
          const game = this.createGame(computerClient.id, user);
          const computer = this.getPlayer(computerClient.id);
          computer.connect = new Connect({
            send: (data) => {
              computerClient.action(data);
            },
            close: () => {},
          });
        }
      }, 20 * 1000);
      onQuit(() => {
        clearTimeout(timer);
        // 如果用户取消排队，则从队列中移除
        const idx = this.queue.findIndex((item) => item.user === user);
        if (idx !== -1) {
          this.queue.splice(idx, 1);
        }
      });
    }
    const roomId = await promise;
    return roomId;
  }
  getPlayer(id: string) {
    return this.allZoom[id];
  }
  createGame(user1: string, user2: string) {
    let player1 = new Player(user1);
    let player2 = new Player(user2);
    if (Math.random() < 0.5) {
      // 随机决定先手
      [player1, player2] = [player2, player1];
    }
    const game = new GameZoom(player1, player2);
    game.on("gameOver", () => {
      // 游戏结束，清理内存
      delete this.allZoom[player1.id];
      delete this.allZoom[player2.id];
    });
    player1.room = game;
    player2.room = game;
    this.allZoom[player1.id] = player1;
    this.allZoom[player2.id] = player2;
    return game;
  }
}

const app = new Koa();
const router = new Router();
const game = new Game();
app.use((ctx, next) => {
  ctx.user = ctx.cookies.get("user") || "";
  return next();
});

router.get("/api/pending", async (ctx) => {
  const user = ctx.query.user as string;
  ctx.cookies.set("user", user);
  const roomId = await game.pending(user, (cb) => {
    ctx.res.on("close", cb);
  });
  ctx.body = roomId;
});

router.get("/sse/connect", async (ctx) => {
  const user = ctx.user;
  const player = game.getPlayer(user);

  ctx.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  ctx.status = 200;
  ctx.flushHeaders();
  if (!player) {
    ctx.res.write("event: error\ndata: 对局不存在\n\n");
    ctx.res.end();
    return;
  }
  const oldConnect = player.connect;
  if (oldConnect) {
    try {
      oldConnect?.close();
    } catch (error) {
      //
    }
  }
  let closeConnect: any;
  const promise = new Promise((resolve, reject) => {
    closeConnect = resolve;
  });
  const connect = new Connect({
    send: (data) => ctx.res.write(`data: ${data}\n\n`),
    close: () => {
      console.log("游戏结束");
      ctx.res.end();
      closeConnect();
    },
  });
  player.connect = connect;
  const room = player.room!;
  const currentPlayer = room.currentPlayer === 0 ? room.player1 : room.player2;
  connect.initGame({
    cards: cards as CardData[],
    self: {
      health: player.health,
      stackNum: player.allCards.length,
      handcards: player.handCards?.map((item) => item.id) || [],
      defenseCards: player.defenseZones?.map((item) => item?.id || null) || [],
    },
    enemy: {
      id: player.enemy?.id || "",
      machine: player.enemy?.machine || false,
      health: player.enemy?.health || 0,
      stackNum: player.enemy?.allCards.length || 0,
      handcards: player.enemy?.handCards?.map((item) => -1) || [],
      defenseCards:
        player.enemy?.defenseZones?.map((item) => item?.id || null) || [],
    },
    selfTurn: currentPlayer.id === player.id,
  });
  ctx.res.on("close", () => {
    player.connect = undefined;
  });
  await promise;
});

router.get("/api/play", (ctx) => {
  const user = ctx.user;
  const player = game.getPlayer(user);
  if (!player) {
    ctx.status = 400;
    ctx.body = "对局不存在";
    return;
  }
  const id = Number(ctx.query.id);
  const room = player.room!;
  room.playCard(player.id === room.player1.id ? 0 : 1, id);
  ctx.body = "ok";
});

router.get("/api/turnEnd", (ctx) => {
  const user = ctx.user;
  const player = game.getPlayer(user);
  if (!player) {
    ctx.status = 400;
    ctx.body = "对局不存在";
    return;
  }
  const room = player.room!;
  room.turnEnd(player.id === room.player1.id ? 0 : 1);
  ctx.body = player.id === room.player1.id ? 0 : 1;
});

router.get("/api/skipDefenseCard", (ctx) => {
  const user = ctx.user;
  const player = game.getPlayer(user);
  if (!player) {
    ctx.status = 400;
    ctx.body = "对局不存在";
    return;
  }
  const room = player.room!;
  room.skipDefenseCard(player.id === room.player1.id ? 0 : 1);
  ctx.body = "ok";
});
router.get("/api/gameInfo", (ctx) => {
  const user = ctx.user;
  const player = game.getPlayer(user);
  if (!player) {
    ctx.status = 200;
    ctx.body = null;
    return;
  }
  const play_t = player.enemy;

  ctx.body = {
    p1Info: {
      name: player.name,
      src: player.imgSrc,
    },
    p2Info: {
      name: play_t?.name,
      src: play_t?.imgSrc,
    },
  };
});
router.get("/api/debug", (ctx) => {
  const user = ctx.user;
  const player = game.getPlayer(user);
  if (!player) {
    ctx.status = 400;
    ctx.body = "对局不存在";
    return;
  }
  const room = player.room!;
  const player_t = player.enemy;
  const currentPlayer = room.currentPlayer === 0 ? room.player1 : room.player2;
  const res = {
    user: player.id,
    self: currentPlayer.id === player.id,
    enemy: player_t?.enemy?.id,
    currentPlayer: room.currentPlayer,
    p1Hand: room.player1.handCards?.map((item) => item.name),
    p2Hand: room.player2.handCards?.map((item) => item.name),
    p1Danger: room.player1.danger,
    p1Id: room.player1.id,
    p2Danger: room.player2.danger,
    p2Id: room.player2.id,
  };
  console.log(res, "res");
  ctx.body = res;
});
app.use(router.routes());
app.use(router.allowedMethods());
const PORT = 4004;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
