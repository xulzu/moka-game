import EventEmitter from "events";
import { DataStore } from "./sqlite";
export class GameZoom extends EventEmitter {
    constructor(player1, player2) {
        super();
        Object.defineProperty(this, "player1", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "player2", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "playerPending", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); //玩家上线回调
        Object.defineProperty(this, "currentPlayer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "timeoutTimer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "waitTimer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "startTimer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "turnIdx", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "started", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "gameFinish", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "winner_id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ""
        });
        this.player1 = player1;
        this.player2 = player2;
        this.player1.enemy = player2;
        this.player2.enemy = player1;
        this.startTimer = setTimeout(() => {
            this.gameOver();
        }, 30 * 1000);
    }
    gameStart() {
        if (this.started)
            return;
        clearTimeout(this.startTimer);
        // 游戏开始，初始化游戏状态,并开始第一回合倒计时
        this.player1.drawCard(2);
        this.player2.drawCard(2);
        this.started = true;
        this.nextTurn();
    }
    playCard(rule, id) {
        if (this.gameFinish)
            return;
        const player = rule === 0 ? this.player1 : this.player2;
        const player_t = player.enemy;
        const card = player.handCards.find((c) => c.id === id);
        if (this.currentPlayer !== rule &&
            (player_t.danger === -1 || card?.type !== "defense")) {
            player.connect?.optError("目前不是你的回合~");
            return;
        }
        const ok = player.playCard(id);
        if (ok && player.danger !== -1) {
            this.waitDefenseCard(id);
        }
        if (ok && player.danger === -1) {
            player.connect?.playAnimation(id);
            player_t.connect?.playAnimation(id);
        }
    }
    //打出攻击卡后等待对方打出防御卡
    waitDefenseCard(id) {
        const player = this.currentPlayer === 0 ? this.player1 : this.player2;
        const player_t = this.currentPlayer === 0 ? this.player2 : this.player1;
        player.connect?.waitDefenseCard(false, 5, id);
        player_t.connect?.waitDefenseCard(true, 5, id);
        let timeIdx = 5;
        this.waitTimer = setInterval(() => {
            timeIdx--;
            player.connect?.waitDefenseCard(false, timeIdx, id);
            player_t.connect?.waitDefenseCard(true, timeIdx, id);
            console.log(player.id, "等待对方防御");
            if (timeIdx <= 0) {
                clearInterval(this.waitTimer);
                this.waitTimer = undefined;
                player.flushAttack();
            }
        }, 1000);
    }
    // 某个玩家跳过防御卡打出
    skipDefenseCard(rule) {
        if (this.gameFinish)
            return;
        if (this.currentPlayer === rule) {
            return;
        }
        if (this.waitTimer) {
            clearInterval(this.waitTimer);
            this.waitTimer = undefined;
            const player = rule === 0 ? this.player1 : this.player2;
            const player_t = rule === 0 ? this.player2 : this.player1;
            player_t.flushAttack();
            player.connect?.waitDefenseCard(true, 0, -1);
            player_t.connect?.waitDefenseCard(false, 0, -1);
        }
    }
    //玩家p1 or p2 回合结束
    turnEnd(rule) {
        if (this.gameFinish)
            return;
        const player = rule === 0 ? this.player1 : this.player2;
        if (this.currentPlayer !== rule) {
            player.connect?.optError("目前不是你的回合~");
            return;
        }
        if (player.danger !== -1) {
            player.connect?.optError("等待对方打出防御卡");
            return;
        }
        if (rule === 0) {
            this.player1.turnEnd();
        }
        else {
            this.player2.turnEnd();
        }
        this.currentPlayer = (this.currentPlayer ^ 1);
        clearInterval(this.timeoutTimer);
        this.timeoutTimer = undefined;
        this.nextTurn();
    }
    nextTurn() {
        if (this.gameFinish)
            return;
        this.turnIdx++;
        // 开始新回合，并设置超时计时
        const player = this.currentPlayer === 0 ? this.player1 : this.player2;
        const player_t = this.currentPlayer === 0 ? this.player2 : this.player1;
        console.log(this.currentPlayer, player.id, "回合开始");
        player.turnStart();
        const timeout = 30;
        let timeIdx = 0;
        this.timeoutTimer = setInterval(() => {
            if (player.danger !== -1) {
                // 如果当前回合玩家打出攻击卡正等待对方打出防御卡，则暂停倒计时，此时会有防御卡倒计时来接管
                return;
            }
            timeIdx++;
            player.connect?.turnEndTimeout(timeout - timeIdx);
            player_t.connect?.turnEndTimeout(timeout - timeIdx);
            if (timeIdx >= timeout) {
                clearInterval(this.timeoutTimer);
                this.turnEnd(this.currentPlayer);
                player.timeoutNum++;
                if (player.timeoutNum === 2) {
                    player.connect?.optError("下次再自动结束回合则会输掉游戏哦-");
                }
                if (player.timeoutNum === 3) {
                    player.health = 0;
                    player.tryGameOver();
                }
            }
        }, 1000);
    }
    gameOver() {
        if (this.gameFinish)
            return;
        clearInterval(this.timeoutTimer);
        clearInterval(this.waitTimer);
        this.gameFinish = true;
        this.emit("gameOver");
        if (this.started) {
            const winner = this.player1.id === this.winner_id ? this.player1 : this.player2;
            const failer = winner.enemy;
            DataStore.updateUserScore(winner.id, winner.score);
            DataStore.updateUserScore(failer.id, failer.score);
            DataStore.addMatch({
                player1_id: this.player1.id,
                player2_id: this.player2.id,
                winner_id: this.winner_id,
                score1: this.player1.score,
                score2: this.player2.score,
            });
        }
    }
}
