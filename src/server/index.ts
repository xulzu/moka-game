import Router from "@koa/router";
import { Connect } from "./Connect";
import { GameZoom } from "./GameZoom";
import Koa from "koa";
type PendingResolve = (t: number) => void;
import type { CardData } from "../baseType/base";
import { Computer } from "./Computer";
import { Player } from "./Player";
import { DataStore } from "./sqlite";
import { Config } from "./Configs";
import staticServe from "koa-static";
import NodeCache from "node-cache";
import dayjs from "dayjs";
import axios from "axios";
import { queryAvatar } from "./utils";
const GlobalCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

class Game {
  queue: { user: string; resolve: PendingResolve }[] = [];
  private allZoom: Record<string, Player> = {};
  cancelFn: Record<string, () => void> = {};
  //等待匹配
  async pending(user: string) {
    const idx = this.queue.findIndex((item) => item.user === user);
    if (idx !== -1) {
      this.queue.splice(idx, 1);
    }
    let resolve_: (t: number) => void;
    const promise = new Promise<number>((resolve) => {
      resolve_ = resolve;
    });
    let timer: any = void 0;
    if (this.queue.length) {
      const { user: p2, resolve: resolve_2 } = this.queue.shift()!;
      this.createGame(user, p2);
      resolve_2?.(1);
      resolve_!(1);
    } else {
      this.queue.push({ user, resolve: resolve_! });
      timer = setTimeout(() => {
        const idx = this.queue.findIndex((item) => item.user === user);
        if (idx !== -1) {
          this.queue.splice(idx, 1);
          const pd_id = Computer.getId();
          const game = this.createGame(pd_id, user);
          new Computer(pd_id, game);
          resolve_(1);
        }
      }, 10 * 1000);
      this.cancelFn[user] = () => {
        clearTimeout(timer);
        resolve_(0);
        // 如果用户取消排队，则从队列中移除
        const idx = this.queue.findIndex((item) => item.user === user);
        if (idx !== -1) {
          this.queue.splice(idx, 1);
        }
      };
    }
    const res = await promise;
    clearTimeout(timer);
    delete this.cancelFn[user];
    return res;
  }
  getZoom() {
    return this.allZoom;
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
    if (player1.id === "roobot") {
      // 人机始终后手
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
  cancel(user: string) {
    this.cancelFn[user]?.();
    delete this.cancelFn[user];
  }
}

const app = new Koa();
const router = new Router();
const game = new Game();

//错误处理中间件
app.use(async (ctx, next) => {
  try {
    await next(); // 执行下一个中间件或路由
  } catch (err) {
    console.error("Koa caught error:", err);
    ctx.status = err.status || 500;
    ctx.body = {
      message: err.message || "程序出错",
    };
  }
});

//认证jwt中间件
app.use(async (ctx, next) => {
  const jwt =
    ctx.cookies.get("bearer") ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJQQyIsInN1YiI6IuW-kOemj-WGmyIsImF1ZCI6WyJncm91cCJdLCJleHAiOjE3NTUyNzkzMTcsIm5iZiI6MTc1NTI1NzY1NywiaWF0IjoxNzU1MjU3NzE3LCJqdGkiOiIyMzAyNTAiLCJwaHQiOiJodHRwOi8vZGRjZG4uZWFzdG1vbmV5LmNvbS9pbWFnZS85MzEzMzY4MzYwMjQ0ODM4NC5qcGciLCJhdnQiOiJodHRwczovL2Rvbmdkb25nLWFwaS5lYXN0bW9uZXkuY29tL2Rvbmdkb25nLWNkbi9pbWFnZS8zMTA3Mjk2ODc5ODY1NDgyMjQucG5nIn0.bNwyOkF824QhaEC3uRFRzcGFPLrdNCJXJLi-yBEZqPM";
  const isDev = Config.DEV;
  if (!jwt && !isDev) {
    throw new Error("请先登录");
  }
  let user = "";
  if (GlobalCache.has(jwt) && !isDev) {
    user = GlobalCache.get(jwt);
  } else {
    let userid = "";
    let username = "";
    if (isDev) {
      userid = ctx.cookies.get("user");
      username = ctx.cookies.get("username");
      if (!userid) {
        userid = "random_" + String(Math.random()).slice(2, 7);
        username = userid;
        // userid = "220811";
        // username = "zy3";
        ctx.cookies.set("user", userid);
        ctx.cookies.set("username", encodeURIComponent(username));
      }
    } else {
      const { data } = await axios
        .get("/api/token/valid", {
          baseURL: Config.AUTH_URL,
          timeout: 5 * 1000,
          params: {
            bearer: jwt,
          },
        })
        .catch((err) => {
          console.error("三方jwt认证服务出错", err);
          throw new Error("认证出错");
        });
      userid = data?.job_number;
      username = data?.name;
    }

    if (!userid || !username) {
      throw new Error("认证出错,缺少用户名或工号");
    }
    const userInfo = DataStore.getUser(userid);
    if (!userInfo) {
      DataStore.addUser({
        userid,
        name: username,
        avatar: "",
        score: 0,
      });
    }
    user = userid;
    //jwt 和 用户id 缓存10分钟，过期后重新认证，不然每次都http去其他系统认证耗时间
    GlobalCache.set(jwt, userid, 10 * 60);
  }
  ctx.user = user;
  return next();
});
app.use(staticServe("static"));
router.get("/api/init", (ctx) => {
  const userid = ctx.user as string;
  const self = DataStore.getUser(userid);
  if (!Config.DEV) {
    //异步更新头像
    queryAvatar(userid).then((avatar) => {
      if (avatar) {
        DataStore.updateUserAvatar(userid, avatar);
      }
    });
  }

  ctx.body = self;
});
router.get("/api/list", (ctx) => {
  const list = DataStore.getTopUsers();
  ctx.body = list;
});

router.get("/api/allCards", (ctx) => {
  ctx.body = Config.AllCards;
});
router.get("/sse/pending", async (ctx) => {
  const user = ctx.user;
  const match = user && DataStore.getUser(user);

  ctx.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  ctx.status = 200;
  ctx.flushHeaders();
  if (!match) {
    ctx.res.write(`event: error\n`);
    ctx.res.write("data: 用户不存在\n\n");
    ctx.res.end();
    return;
  }
  const stamina = readStamina(user);
  if (stamina <= 2) {
    ctx.res.write(`event: error\n`);
    ctx.res.write("data: 体力不足2点，请等待体力恢复\n\n");
    ctx.res.end();
    return;
  }

  ctx.res.write("retry: 0\n\n");
  ctx.req.on("close", () => {
    game.cancel(user);
    ctx.res.end();
  });

  const ok = await game.pending(user);
  ctx.res.write(`data:${ok}\n\n`);
  if (ok) {
    // 匹配成功，消耗2点体力,注意别减到负数
    DataStore.updateStamina(user, Math.max(0, stamina - 2));
  }
});
router.get("/api/cancel", (ctx) => {
  const user = ctx.user;
  game.cancel(user);
  ctx.body = "ok";
});
router.get("/sse/connect", async (ctx) => {
  const user = ctx.user || ctx.query.user;
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

  let closeConnect: any;
  const promise = new Promise((resolve, reject) => {
    closeConnect = resolve;
  });
  const connect = new Connect({
    send: (data) => ctx.res.write(`data: ${data}\n\n`),
    close: () => {
      closeConnect();
    },
  });
  player.connect = connect;
  const room = player.room!;
  const currentPlayer = room.currentPlayer === 0 ? room.player1 : room.player2;
  const p1 = DataStore.getUser(player.id);
  const p2 = DataStore.getUser(player.enemy!.id);
  connect.initGame({
    cards: Config.AllCards as CardData[],
    self: {
      name: p1.name,
      avatar: p1.avatar,
      health: player.health,
      stackNum: player.allCards.length,
      firstConnect: player.firstConnect,
      handcards: player.handCards?.map((item) => item.id) || [],
      defenseCards: player.defenseZones?.map((item) => item?.id || null) || [],
    },
    enemy: {
      name: p2.name,
      avatar: p2.avatar,
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
  player.firstConnect = false;
  ctx.req.on("close", () => {
    player.connect = undefined;
  });
  room.gameStart();
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
  const play_t = player.enemy!;
  const p1 = DataStore.getUser(player.id) as any;
  const p2 = DataStore.getUser(play_t.id) as any;

  ctx.body = {
    p1Info: {
      name: p1.name,
      src: p1.avatar,
    },
    p2Info: {
      name: p2?.name,
      src: p2?.avatar,
    },
  };
});
router.get("/api/lose", (ctx) => {
  const user = ctx.user;
  const player = game.getPlayer(user);
  if (!player) {
    ctx.status = 400;
    ctx.body = "对局不存在";
    return;
  }
  player.health = 0;
  player.tryGameOver();
  ctx.status = 200;
});
router.get("/api/test", (ctx) => {
  const user = ctx.user;
  const player = game.getPlayer(user);
  if (!player) {
    ctx.status = 400;
    ctx.body = "对局不存在";
    return;
  }
  ctx.body = {
    hands: player.handCards,
    danger: player.danger,
  };
});
router.get("/api/debug", (ctx) => {
  ctx.body = Object.keys(game.getZoom());
});
router.get("/api/sigins", (ctx) => {
  const user = ctx.user;
  const today = dayjs().format("YYYY-MM-DD");
  const data = DataStore.getSigins(user)?.map((item) => item.date) || [];
  const cfg = Config.SIGN_START_DAY || [];
  const arr = new Array(cfg.length).fill(0);
  for (let i = 0; i < arr.length; i++) {
    const has = data.includes(cfg[i]);
    if (has) {
      arr[i] = 1;
    } else {
      arr[i] = cfg[i] < today ? -1 : 0;
    }
  }
  ctx.body = arr.map((item, idx) => {
    return {
      sigin: item,
      date: cfg[idx],
    };
  });
});
router.get("/api/signin", (ctx) => {
  const user = ctx.user;
  const cur_date = dayjs().format("YYYY-MM-DD");
  const ready = DataStore.getSignin(user, cur_date);
  if (ready) {
    ctx.status = 400;
    ctx.body = "今天已经签到过了";
    return;
  }
  DataStore.addSignin(user, cur_date);
  DataStore.updateUserScore(user, 5);
  ctx.body = "ok";
});
router.get("/api/signin/status", (ctx) => {
  const user = ctx.user;
  const cur_date = dayjs().format("YYYY-MM-DD");
  const ready = DataStore.getSignin(user, cur_date);
  ctx.body = !!ready;
});
router.get("/api/stamina", (ctx) => {
  const user = ctx.user;
  const stamina = readStamina(user);
  ctx.body = stamina;
});

app.use(router.routes());
app.use(router.allowedMethods());
const PORT = Config.PORT;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

function readStamina(userid: string) {
  const data = DataStore.getStamina(userid);
  if (!data) {
    DataStore.addStamina(userid, 24);
    return 24;
  }
  const now = Date.now();
  const last_update = data.last_update;
  const diff_ms = now - last_update;
  const diff_h = Math.floor(diff_ms / 1000 / 60 / 60);
  //每小时恢复1点体力，最多24点
  const stamina = Math.min(data.stamina + diff_h, 24);

  DataStore.updateStamina(userid, stamina);
  return stamina;
}
