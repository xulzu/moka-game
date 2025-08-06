import { Connect } from "./Connect.js";
import { DataStore } from "./sqlite.js";
export class Computer {
    constructor(id, game) {
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "zoom", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "self", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "zoomRole", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "waitFinish", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "waitLock", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
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
    async action(params) {
        const data = JSON.parse(params);
        const { type } = data || {};
        if (type === "drawEnd") {
            this.waitLock = false;
            await this.randomPlayAttck();
            setTimeout(() => {
                this.zoom?.turnEnd(this.zoomRole);
            }, 1000);
        }
        else if (type === "flushAttack") {
            this.waitFinish?.();
        }
        else if (type === "waitDefenseCard") {
            if (data.data.self && !this.waitLock) {
                this.waitLock = true;
                this.playDefenseCard();
            }
        }
    }
    async playOneCard(id) {
        if (id === -1)
            return;
        await new Promise((res) => {
            setTimeout(() => {
                res();
            }, 2000);
        });
        this.zoom?.playCard(this.zoomRole, id);
        await new Promise((res) => {
            if (this.self.danger === -1) {
                res();
            }
            else {
                this.waitFinish = res;
            }
        });
    }
    //打攻击牌
    async randomPlayAttck() {
        const cards = this.self.handCards.filter((item) => item.type === "attack");
        const cardsSpecial = this.self.handCards.filter((item) => item.type === "special");
        let play3attack = false;
        {
            //先打策略牌，最优先打过牌
            for (const card of cardsSpecial) {
                if (card.name === "防火墙升级") {
                    const cardsDefense = this.self.handCards.filter((item) => item.type === "defense");
                    if (cardsDefense.length) {
                        await this.playOneCard(card.id);
                    }
                }
                else {
                    await this.playOneCard(card.id);
                    play3attack = card.name === "攻击脚本优化";
                }
            }
        }
        let id1 = -1;
        let id2 = -1;
        let id3 = -1;
        (() => {
            if (id1 !== -1)
                return;
            //判断手上是否同时有web攻击和提权攻击
            const web = cards.find((item) => item.tag2 === "WEB_ATTACK" && item.name !== "提权攻击");
            const tq = cards.find((item) => item.name === "提权攻击");
            if (web && tq) {
                id1 = web.id;
                id2 = tq.id;
            }
        })();
        (() => {
            if (id1 !== -1)
                return;
            //判断手上是否有两张弱口令攻击
            const c1 = cards.find((item) => item.name === "弱口令攻击");
            const c2 = cards.find((item) => item.name === "弱口令攻击" && item.id !== c1.id);
            if (c1 && c2) {
                id1 = c1.id;
                id2 = c2.id;
            }
        })();
        (() => {
            if (id1 !== -1)
                return;
            //判断手上是否有社工和恶意广告
            const c1 = cards.find((item) => item.tag2 === "SOCIAL_ENGINEERING" && item.name !== "恶意广告");
            const c2 = cards.find((item) => item.name === "恶意广告");
            if (c1 && c2) {
                id1 = c1.id;
                id2 = c2.id;
            }
        })();
        (() => {
            if (id1 !== -1)
                return;
            //是否能先打攻击小的再打大的
            const cardsOrder = [...cards].sort((a, b) => a.attack - b.attack);
            const c1 = cardsOrder[0];
            const c2 = cardsOrder[1];
            if (c1 && c2) {
                id1 = c1.id;
                id2 = c2.id;
            }
        })();
        if (id1 === -1) {
            id1 = cards[0]?.id ?? -1;
        }
        if (id2 === -1) {
            id2 = cards[1]?.id ?? -1;
        }
        if (play3attack) {
            const c3 = cards.find((item) => item.id !== id1 && item.id !== id2);
            id3 = c3?.id;
        }
        id1 ?? (id1 = -1);
        id2 ?? (id2 = -1);
        id3 ?? (id3 = -1);
        //尝试打出两张攻击牌，注意判断是否需要打出第三张
        await this.playOneCard(id1);
        await this.playOneCard(id2);
        await this.playOneCard(id3);
    }
    //打防御牌
    async playDefenseCard() {
        const card = this.self.handCards.find((item) => item.type === "defense");
        if (card) {
            const id = card.id;
            await new Promise((res) => {
                setTimeout(() => {
                    res();
                }, 1000);
            });
            this.zoom?.playCard(this.zoomRole, id);
        }
        this.waitLock = false;
    }
    static getId() {
        const pcid = "roobot";
        const pcInfo = DataStore.getUser(pcid);
        if (!pcInfo) {
            DataStore.addUser({
                userid: pcid,
                name: "神秘玩家",
                avatar: "",
                score: 0,
            });
        }
        return pcid;
    }
}
