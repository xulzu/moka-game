import type { CardData } from "../baseType/base";

type Res = { send: (data: string) => void; close: () => void };
export class Connect {
  private res: Res;
  constructor(res: Res) {
    this.res = res;
  }
  /** 关闭连接 */
  close() {
    this.res.close();
  }
  initGame(data: {
    cards: CardData[];
    self: {
      health: number;
      handcards: number[];
      defenseCards: (number | null)[];
    };
    enemy: {
      id: string;
      machine: boolean;
      health: number;
      handcards: number[];
      defenseCards: (number | null)[];
    };
    selfTurn: boolean;
  }) {
    this.res.send(
      JSON.stringify({
        type: "initGame",
        data,
      })
    );
  }
  /** 回合开始 */
  turnStart(self: boolean) {
    this.res.send(
      JSON.stringify({
        type: "turnStart",
        self,
      })
    );
  }
  //抽n张牌
  drawCard(ids: number[], self: boolean) {
    this.res.send(
      JSON.stringify({
        type: "drawCard",
        data: ids,
        self,
      })
    );
  }
  //错误
  optError(msg: string) {
    this.res.send(
      JSON.stringify({
        type: "error",
        data: msg,
      })
    );
  }
  // 防御卡受伤
  defenseCardHurt(zoneIndex: number, lastHealth: number) {
    this.res.send(
      JSON.stringify({
        type: "defenseCardHurt",
        data: { zoneIndex, lastHealth: Math.max(0, lastHealth) },
      })
    );
  }

  //水晶受伤 0自己 1对方
  homeHurt(role: 0 | 1, lastHealth: number) {
    this.res.send(
      JSON.stringify({
        type: "homeHurt",
        data: { role, lastHealth: Math.max(0, lastHealth) },
      })
    );
  }
  //展示n张卡牌
  viewCard(ids: number[]) {
    this.res.send(
      JSON.stringify({
        type: "viewCard",
        data: ids,
      })
    );
  }
  moreHandCard() {
    this.res.send(
      JSON.stringify({
        type: "moreHandCard",
      })
    );
  }
  removeCard(id: number) {
    this.res.send(
      JSON.stringify({
        type: "removeCard",
        data: id,
      })
    );
  }
  p2RemoveCard(idx: number) {
    this.res.send(
      JSON.stringify({
        type: "p2RemoveCard",
        data: idx,
      })
    );
  }
  gameOver(type: "win" | "lose") {
    this.res.send(
      JSON.stringify({
        type: "gameOver",
        data: type,
      })
    );
    this.close();
  }
  turnEndTimeout(time: number) {
    this.res.send(
      JSON.stringify({
        type: "turnEndTimeout",
        data: time,
      })
    );
  }
  setDefenseCard(zoneIndex: number, id: number | null) {
    this.res.send(
      JSON.stringify({
        type: "setDefenseCard",
        data: { zoneIndex, id },
      })
    );
  }
  waitDefenseCard(self: boolean, time: number) {
    this.res.send(
      JSON.stringify({
        type: "waitDefenseCard",
        data: { self, time },
      })
    );
  }
  //回合结束
  turnEnd() {
    this.res.send(
      JSON.stringify({
        type: "turnEnd",
      })
    );
  }
}
