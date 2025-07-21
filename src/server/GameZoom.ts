import { cloneDeep } from "lodash-es";
import {
  type AttackCardData,
  type CardData,
  type DefenseCardData,
  type Effect,
  type SpecialCardData,
} from "../baseType/base";
import cards from "./cards.json";
import { Connect } from "./Connect";
import EventEmitter from "events";
export class Player {
  id: string;
  name?: string;
  imgSrc?: string;
  room?: GameZoom;
  handCards: CardData[] = [];
  allCards: CardData[] = [];
  defenseZones: [DefenseCardData | null, DefenseCardData | null] = [null, null];
  health: number = 20;
  enemy?: Player;
  prevCard?: CardData; // 上一张打出的牌 , 用于结算效果
  connect?: Connect;
  machine: boolean = false; //是否是AI

  attackNumOneTurn: number = 0; //本回合打出的攻击卡数量
  playLimitOneTurn: number = Infinity; //本回合打出的牌数量限制
  attckTemp: number = 0; //本回合攻击力临时增加
  denfenseTemp: number = 0; //临时防御力
  nextEffect: Effect[] = []; //下回合结算的效果

  danger: number = -1; //打出的攻击卡即将造成的伤害 -1表示没有打出攻击卡

  constructor(id: string) {
    this.id = id;
    this.allCards = cloneDeep(cards) as CardData[];
  }

  //抽牌,如果牌库没牌，则判负
  drawCard(n: number) {
    const diff = n - this.allCards.length;
    if (this.allCards.length) {
      const nextCards = this.allCards.splice(0, n);
      this.handCards.push(...(nextCards || []));
      this.connect?.drawCard(nextCards?.map((c) => c.id) || [], true);
      this.enemy?.connect?.drawCard(
        new Array(nextCards.length).fill(-1),
        false
      );
    }

    if (diff > 0) {
      this.health -= diff;
      this.connect?.homeHurt(0, this.health);
      this.enemy?.connect?.homeHurt(1, this.enemy.health);
      this.tryGameOver();
    }

    this.connect?.cardStackNumUpdate(true, this.allCards.length);
    this.enemy?.connect?.cardStackNumUpdate(
      false,
      this.enemy?.allCards.length || 0
    );
  }
  turnStart() {
    this.attackNumOneTurn = 0;
    this.playLimitOneTurn = Infinity;
    this.attckTemp = 0;
    this.denfenseTemp = 0;
    //新回合开始，结算上回合遗留的效果
    for (const e of this.nextEffect) {
      this.calcSpecialEffect(0, e);
    }
    this.nextEffect = [];
    this.drawCard(2);
    this.connect?.turnStart(true);
    this.enemy?.connect?.turnStart(false);
  }
  //打出牌,要负责数据校验
  playCard(zoneIndex: 0 | 1, id: number) {
    const idx = this.handCards.findIndex((c) => c.id === id);
    const card = this.handCards[idx];
    if (!card) {
      this.connect?.optError("手牌中没有该牌");
      return;
    }

    if (this.playLimitOneTurn <= 0) {
      this.connect?.optError("本回合无法打出牌");
      return;
    }
    if (this.danger !== -1) {
      this.connect?.optError("等待对方打出防御卡");
      return;
    }

    if (card?.type === "attack") {
      if (this.attackNumOneTurn >= 2) {
        this.connect?.optError("一回合只能打出两张攻击卡");
        return;
      }
      this.attackNumOneTurn++;
      this.handleAttackCard(card);
    } else if (card.type === "defense") {
      if (this.enemy?.danger === -1) {
        this.connect?.optError("防御卡只能在对方打出攻击卡后使用");
        return;
      }
      this.handleDefenseCard(card);
    } else if (card.type === "special") {
      const effect = card.effect;
      if (effect.some((item) => item.name === "s_1")) {
        const idx_2 = (zoneIndex ^ 1) as 0 | 1;
        if (!this.defenseZones[zoneIndex] && !this.defenseZones[idx_2]) {
          this.connect?.optError("需要选定防御牌生效");
          return;
        }
        if (this.defenseZones[zoneIndex]) {
          this.handleSpecialCard(zoneIndex, card);
        } else if (this.defenseZones[idx_2]) {
          this.handleSpecialCard(idx_2, card);
        }
      } else {
        this.handleSpecialCard(zoneIndex, card);
      }
    }
    this.handCards.splice(this.handCards.indexOf(card), 1);
    this.connect?.removeCard(id);
    this.enemy?.connect?.p2RemoveCard(idx);
    this.playLimitOneTurn--;
    this.prevCard = card; // 记录上一张打出的牌
    this.tryGameOver(); // 尝试看能否结束游戏
    return 1;
  }
  turnEnd() {
    if (this.handCards.length > 4) {
      this.connect?.moreHandCard();
      //从左到右弃牌直到手牌数量小于等于4
      while (this.handCards.length > 4) {
        this.connect?.removeCard(this.handCards[0].id);
        this.enemy?.connect?.p2RemoveCard(0);
        this.handCards.splice(0, 1);
      }
    }
  }

  //防御卡结算
  private handleDefenseCard(card: DefenseCardData) {
    // 打出防御卡后，清理定时器
    if (this.room?.waitTimer) {
      clearInterval(this.room.waitTimer);
      this.room.waitTimer = undefined;
      this.connect?.waitDefenseCard(true, 0, -1);
      this.enemy?.connect?.waitDefenseCard(false, 0, -1);
    }
    this.enemy?.flushAttack(card.defense);
  }
  //结算玩家打出攻击卡
  private handleAttackCard(card: AttackCardData) {
    let danger = card.attack;
    {
      //结算连击combo
      if (
        card.tag3 === "CHAINABLE" &&
        this.prevCard?.type === "attack" &&
        this.prevCard.tag2 === card.link
      ) {
        const effect = card.linkEffect;
        for (const e of effect) {
          if (e.name === "c_1") {
            danger += Number(e.args.n) || 0;
          }
        }
      }
    }
    this.danger = danger;
    const hasDefense = this.enemy?.handCards.some(
      (item) => item.type === "defense"
    );
    const test = true;
    // 如果敌方没有防御卡，则直接结算伤害,否则等待对方打出防御卡
    if (!hasDefense) {
      this.flushAttack();
    }
  }
  flushAttack(defense: number = 0) {
    if (this.danger !== -1 && this.enemy) {
      this.enemy.health -= Math.max(0, this.danger - defense);
      // 结算对敌方水晶伤害
      this.connect?.homeHurt(1, this.enemy.health);
      this.enemy.connect?.homeHurt(0, this.enemy.health);
      this.danger = -1; // 结算后重置伤害值
    }
  }
  //策略卡结算
  private handleSpecialCard(zoneIndex: 0 | 1, card: SpecialCardData) {
    for (const e of card.effect) {
      if (e.name === "s_1") {
        const index2 = (zoneIndex ^ 1) as 0 | 1;
        if (this.defenseZones[zoneIndex]) {
          this.calcSpecialEffect(zoneIndex, e);
        } else if (this.defenseZones[index2]) {
          this.calcSpecialEffect(index2, e);
        }
      } else if (["s_2", "s_3", "s_4"].includes(e.name)) {
        // 当前回合就能结算的效果
        this.calcSpecialEffect(zoneIndex, e);
      } else {
        //下回合才能结算的效果
        const player = e.args.p as number;
        if (player === 0) {
          this.nextEffect.push(e);
        } else {
          this.enemy?.nextEffect.push(e);
        }
      }
    }
  }
  private calcSpecialEffect(zoneIndex: 0 | 1, effect: Effect) {
    if (effect.name === "s_1") {
      if (this.defenseZones[zoneIndex]) {
        this.defenseZones[zoneIndex].health += Number(effect.args.n) || 0;
      }
    } else if (effect.name === "s_2") {
      this.drawCard(Number(effect.args.n) || 0);
    } else if (effect.name === "s_3") {
      const n = Number(effect.args.n) || 0;
      const next = this.enemy?.allCards.slice(0, n) || [];
      this.connect?.viewCard(next.map((c) => c.id));
    } else if (effect.name === "s_4") {
      this.attckTemp += Number(effect.args.n) || 0;
    } else if (effect.name === "s_6") {
      this.attckTemp += Number(effect.args.n) || 0;
    } else if (effect.name === "s_7") {
      this.playLimitOneTurn = Number(effect.args.n) || 0;
    } else if (effect.name === "s_8") {
      this.denfenseTemp += Number(effect.args.n) || 0;
    }
  }

  tryGameOver() {
    if (this.health <= 0) {
      this.connect?.gameOver("lose");
      this.enemy?.connect?.gameOver("win");
      this.room?.gameOver();
    } else if ((this.enemy?.health || 0) <= 0) {
      this.connect?.gameOver("win");
      this.enemy?.connect?.gameOver("lose");
      this.room?.gameOver();
    }
  }
}

export class GameZoom extends EventEmitter {
  player1: Player;
  player2: Player;
  playerPending?: () => void; //玩家上线回调
  id: string;
  currentPlayer: 0 | 1 = 0;
  timeoutTimer?: any;
  waitTimer?: any;
  turnIdx: number = 1;
  constructor(player1: Player, player2: Player) {
    super();
    this.player1 = player1;
    this.player2 = player2;
    this.player1.enemy = player2;
    this.player2.enemy = player1;
    this.id = createRandomId();

    // 游戏开始，初始化游戏状态,并开始第一回合倒计时
    this.player1.drawCard(2);
    this.player2.drawCard(2);
    if (this.player2.machine) {
      this.player2.playCard(0, 2);
    }
    this.nextTurn();
  }
  playCard(rule: 0 | 1, zoneIndex: 0 | 1, id: number) {
    const player = rule === 0 ? this.player1 : this.player2;
    const player_t = player.enemy!;
    const card = player.handCards.find((c) => c.id === id);
    if (
      this.currentPlayer !== rule &&
      (player_t.danger === -1 || card?.type !== "defense")
    ) {
      player.connect?.optError("目前不是你的回合~");
      return;
    }
    const ok = player.playCard(zoneIndex, id);
    if (ok && player.danger !== -1) {
      console.log("等待防御");
      this.waitDefenseCard(id);
    }
    if (ok && player.danger === -1) {
      player.connect?.playAnimation(id);
      player_t.connect?.playAnimation(id);
    }
  }

  //打出攻击卡后等待对方打出防御卡
  private waitDefenseCard(id: number) {
    const player = this.currentPlayer === 0 ? this.player1 : this.player2;
    const player_t = this.currentPlayer === 0 ? this.player2 : this.player1;
    player.connect?.waitDefenseCard(false, 5, id);
    player_t.connect?.waitDefenseCard(true, 5, id);
    let timeIdx = 5;
    this.waitTimer = setInterval(() => {
      timeIdx--;
      player.connect?.waitDefenseCard(false, timeIdx, id);
      player_t.connect?.waitDefenseCard(true, timeIdx, id);
      if (timeIdx <= 0) {
        clearInterval(this.waitTimer);
        this.waitTimer = undefined;
        player.flushAttack();
      }
    }, 1000);
  }
  // 某个玩家跳过防御卡打出
  skipDefenseCard(rule: 0 | 1) {
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
  turnEnd(rule: 0 | 1) {
    console.log(rule, "turnEnd");
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
    } else {
      this.player2.turnEnd();
    }
    this.currentPlayer = (this.currentPlayer ^ 1) as 0 | 1;
    clearInterval(this.timeoutTimer);
    this.timeoutTimer = undefined;
    this.nextTurn();
  }
  private nextTurn() {
    this.turnIdx++;
    // 开始新回合，并设置超时计时
    const player = this.currentPlayer === 0 ? this.player1 : this.player2;
    const player_t = this.currentPlayer === 0 ? this.player2 : this.player1;
    console.log(this.currentPlayer, "nextTurn");
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
        // player_t?.connect?.gameOver("win");
        // player?.connect?.gameOver("lose");
        // this.gameOver();
      }
    }, 1000);

    setTimeout(() => {
      if (player.machine) {
        console.log(this.currentPlayer, "machine");
        this.turnEnd(this.currentPlayer);
      }
    }, 1000);
  }
  gameOver() {
    this.emit("gameOver");
  }
}

function createRandomId() {
  return Math.random().toString(36).substring(2, 10);
}
