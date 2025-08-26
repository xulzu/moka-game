export class Connect {
    constructor(res) {
        Object.defineProperty(this, "res", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.res = res;
    }
    /** 关闭连接 */
    close() {
        this.res.close();
    }
    initGame(data) {
        this.res.send(JSON.stringify({
            type: "initGame",
            data,
        }));
    }
    /** 回合开始 */
    turnStart(self) {
        this.res.send(JSON.stringify({
            type: "turnStart",
            self,
        }));
    }
    //抽n张牌
    drawCard(ids, self) {
        this.res.send(JSON.stringify({
            type: "drawCard",
            data: ids,
            self,
        }));
    }
    //错误
    optError(msg) {
        this.res.send(JSON.stringify({
            type: "error",
            data: msg,
        }));
    }
    // 防御卡受伤
    defenseCardHurt(zoneIndex, lastHealth) {
        this.res.send(JSON.stringify({
            type: "defenseCardHurt",
            data: { zoneIndex, lastHealth: Math.max(0, lastHealth) },
        }));
    }
    //水晶受伤 0自己 1对方
    homeHurt(role, lastHealth) {
        this.res.send(JSON.stringify({
            type: "homeHurt",
            data: { role, lastHealth: Math.max(0, lastHealth) },
        }));
    }
    //展示n张卡牌
    viewCard(ids) {
        this.res.send(JSON.stringify({
            type: "viewCard",
            data: ids,
        }));
    }
    moreHandCard() {
        this.res.send(JSON.stringify({
            type: "moreHandCard",
        }));
    }
    //播放打出效果
    playAnimation(card) {
        this.res.send(JSON.stringify({
            type: "playAnimation",
            data: card,
        }));
    }
    removeCard(id) {
        this.res.send(JSON.stringify({
            type: "removeCard",
            data: id,
        }));
    }
    p2RemoveCard(idx) {
        this.res.send(JSON.stringify({
            type: "p2RemoveCard",
            data: idx,
        }));
    }
    gameOver(type, score) {
        this.res.send(JSON.stringify({
            type: "gameOver",
            data: type,
            score,
        }));
    }
    turnEndTimeout(time) {
        this.res.send(JSON.stringify({
            type: "turnEndTimeout",
            data: time,
        }));
    }
    setDefenseCard(zoneIndex, id) {
        this.res.send(JSON.stringify({
            type: "setDefenseCard",
            data: { zoneIndex, id },
        }));
    }
    waitDefenseCard(self, time, cardId) {
        this.res.send(JSON.stringify({
            type: "waitDefenseCard",
            data: { self, time, cardId },
        }));
    }
    cardStackNumUpdate(self, num) {
        this.res.send(JSON.stringify({
            type: "cardStackNumUpdate",
            data: { self, num },
        }));
    }
    //抽牌阶段结束
    drawEnd() {
        this.res.send(JSON.stringify({
            type: "drawEnd",
        }));
    }
    //攻击延时结算完成
    flushAttack() {
        this.res.send(JSON.stringify({
            type: "flushAttack",
        }));
    }
    attackUpdate(id, lastTempAttack) {
        this.res.send(JSON.stringify({
            type: "attackUpdate",
            id,
            lastTempAttack,
        }));
    }
    defenseUpdate(id, lastTempDefense) {
        this.res.send(JSON.stringify({
            type: "defenseUpdate",
            id,
            lastTempDefense,
        }));
    }
    boom(role) {
        this.res.send(JSON.stringify({
            type: "boom",
            data: role,
        }));
    }
    //回合结束
    turnEnd() {
        this.res.send(JSON.stringify({
            type: "turnEnd",
        }));
    }
}
