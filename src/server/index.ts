import Router from "@koa/router";
import { Connect } from "./Connect";
import { GameZoom, Player } from "./GameZoom";
import Koa from "koa";
type PendingResolve = (value: string) => void;

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
    const dev = true;
    if (dev) {
      const player1 = new Player(user);
      const player2 = new Player("test");
      player2.machine = true;

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
      resolve_!(game.id);
    } else if (this.queue.length) {
      const { user: p2, resolve: resolve_2 } = this.queue.shift()!;
      let player1 = new Player(user);
      let player2 = new Player(p2);
      player2.machine = true;
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
      resolve_2?.(game.id);
      resolve_!(game.id);
    } else {
      this.queue.push({ user, resolve: resolve_! });
      onQuit(() => {
        // 如果用户取消排队，则从队列中移除
        const idx = this.queue.findIndex((item) => item.user === user);
        if (idx !== -1) {
          this.queue.splice(idx, 1);
        }
      });
    }
    console.log(this.queue.length, "---");
    const roomId = await promise;
    return roomId;
  }
  getPlayer(id: string) {
    return this.allZoom[id];
  }
}

const app = new Koa();
const router = new Router();
const game = new Game();

router.get("/api/pending", async (ctx) => {
  const user = "230250";
  console.log(game.queue.length, "++++");
  const roomId = await game.pending(user, (cb) => {
    ctx.res.on("close", cb);
  });
  console.log(roomId);
  ctx.body = roomId;
});

router.get("/sse/connect", async (ctx) => {
  console.log(222);
  const user = "230250";
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
  connect.initGame({
    cards: player.allCards,
    self: {
      health: player.health,
      handcards: player.handCards?.map((item) => item.id) || [],
      defenseCards: player.defenseZones?.map((item) => item?.id || null) || [],
    },
    enemy: {
      id: player.enemy?.id || "",
      machine: player.enemy?.machine || false,
      health: player.enemy?.health || 0,
      handcards: player.enemy?.handCards?.map((item) => -1) || [],
      defenseCards:
        player.enemy?.defenseZones?.map((item) => item?.id || null) || [],
    },
    turnId: room?.currentPlayer === 0 ? room.player1.id : room.player2.id,
  });
  ctx.res.on("close", () => {
    console.log("close", "close");
    player.connect = undefined;
  });
  await promise;
});

router.get("/api/play", (ctx) => {
  const user = "230250";
  const player = game.getPlayer(user);
  if (!player) {
    ctx.status = 400;
    ctx.body = "对局不存在";
    return;
  }
  const zoneIndex = Number(ctx.query.zoneIndex) as 0 | 1;
  const id = Number(ctx.query.id);
  const room = player.room!;
  room.playCard(player.id === room.player1.id ? 0 : 1, zoneIndex, id);
  ctx.body = "ok";
});

router.get("/api/turnEnd", (ctx) => {
  const user = "230250";
  const player = game.getPlayer(user);
  if (!player) {
    ctx.status = 400;
    ctx.body = "对局不存在";
    return;
  }
  const room = player.room!;
  room.turnEnd(player.id === room.player1.id ? 0 : 1);
  ctx.body = "ok";
});

router.get("/api/skipDefenseCard", (ctx) => {
  const user = "230250";
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
app.use(router.routes());
app.use(router.allowedMethods());
const PORT = 4004;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
