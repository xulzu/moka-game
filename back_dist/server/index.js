import Router from "@koa/router";
import { Connect } from "./Connect.js";
import { GameZoom } from "./GameZoom.js";
import Koa from "koa";
import { Computer } from "./Computer.js";
import { Player } from "./Player.js";
import { DataStore } from "./sqlite.js";
import { Config } from "./Configs.js";
import staticServe from "koa-static";
class Game {
    constructor() {
        Object.defineProperty(this, "queue", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "allZoom", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "cancelFn", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
    }
    //等待匹配
    async pending(user) {
        const idx = this.queue.findIndex((item) => item.user === user);
        if (idx !== -1) {
            this.queue.splice(idx, 1);
        }
        let resolve_;
        const promise = new Promise((resolve) => {
            resolve_ = resolve;
        });
        let timer = void 0;
        if (this.queue.length) {
            const { user: p2, resolve: resolve_2 } = this.queue.shift();
            const game = this.createGame(user, p2);
            resolve_2?.(1);
            resolve_(1);
        }
        else {
            this.queue.push({ user, resolve: resolve_ });
            timer = setTimeout(() => {
                const idx = this.queue.findIndex((item) => item.user === user);
                if (idx !== -1) {
                    this.queue.splice(idx, 1);
                    const pd_id = Computer.getId();
                    const game = this.createGame(pd_id, user);
                    new Computer(pd_id, game);
                    resolve_(1);
                }
            }, 5 * 1000);
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
    getPlayer(id) {
        return this.allZoom[id];
    }
    createGame(user1, user2) {
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
    cancel(user) {
        if (this.cancelFn[user]) {
            console.log("取消ok");
        }
        this.cancelFn[user]?.();
        delete this.cancelFn[user];
    }
}
const app = new Koa();
const router = new Router();
const game = new Game();
app.use(async (ctx, next) => {
    try {
        await next(); // 执行下一个中间件或路由
    }
    catch (err) {
        console.error("Koa caught error:", err);
        ctx.status = err.status || 500;
        ctx.body = {
            message: err.message || "程序出错",
        };
    }
});
app.use((ctx, next) => {
    ctx.user = ctx.cookies.get("user") || "";
    return next();
});
app.use(staticServe("static"));
router.get("/api/init", (ctx) => {
    const userid = ctx.query.user;
    ctx.cookies.set("user", userid);
    const user = DataStore.getUser(userid);
    if (!user) {
        DataStore.addUser({
            userid: String(userid),
            name: String(userid),
            avatar: "/assets/user_ico.webp",
            score: 0,
        });
    }
    const self = DataStore.getUser(userid);
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
    ctx.set({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
    });
    ctx.status = 200;
    ctx.flushHeaders();
    ctx.res.write("retry: 0\n\n");
    ctx.req.on("close", () => {
        game.cancel(user);
        ctx.res.end();
    });
    const user = ctx.user || ctx.query.user;
    const match = user && DataStore.getUser(user);
    if (!match) {
        ctx.body = "用户不存在" + user;
        ctx.status = 400;
        ctx.res.end();
        return;
    }
    const ok = await game.pending(user);
    ctx.res.write(`data:${ok}\n\n`);
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
    let closeConnect;
    const promise = new Promise((resolve, reject) => {
        closeConnect = resolve;
    });
    const connect = new Connect({
        send: (data) => ctx.res.write(`data: ${data}\n\n`),
        close: () => {
            console.log("游戏结束");
            closeConnect();
        },
    });
    player.connect = connect;
    const room = player.room;
    const currentPlayer = room.currentPlayer === 0 ? room.player1 : room.player2;
    const p1 = DataStore.getUser(player.id);
    const p2 = DataStore.getUser(player.enemy.id);
    connect.initGame({
        cards: Config.AllCards,
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
            defenseCards: player.enemy?.defenseZones?.map((item) => item?.id || null) || [],
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
    const room = player.room;
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
    const room = player.room;
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
    const room = player.room;
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
    const p1 = DataStore.getUser(player.id);
    const p2 = DataStore.getUser(play_t.id);
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
// router.get("/api/debug", (ctx) => {
//   const user = ctx.user;
//   const player = game.getPlayer(user);
//   if (!player) {
//     ctx.status = 400;
//     ctx.body = "对局不存在";
//     return;
//   }
//   const room = player.room!;
//   const player_t = player.enemy;
//   const currentPlayer = room.currentPlayer === 0 ? room.player1 : room.player2;
//   const res = {
//     user: player.id,
//     self: currentPlayer.id === player.id,
//     enemy: player_t?.enemy?.id,
//     currentPlayer: room.currentPlayer,
//     p1Hand: room.player1.handCards?.map((item) => item.name),
//     p2Hand: room.player2.handCards?.map((item) => item.name),
//     p1Danger: room.player1.danger,
//     p1Id: room.player1.id,
//     p2Danger: room.player2.danger,
//     p2Id: room.player2.id,
//   };
//   ctx.body = res;
// });
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
app.use(router.routes());
app.use(router.allowedMethods());
const PORT = Config.PORT;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
