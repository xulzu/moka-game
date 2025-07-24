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
import type { GameZoom } from "./GameZoom";

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
  timeoutNum = 0; //烧绳子多少次
  firstConnect = true;

  attackNumOneTurn: number = 0; //本回合打出的攻击卡数量
  playLimitOneTurn: number = Infinity; //本回合打出的牌数量限制
  attckTemp: number = 0; //本回合攻击力临时增加
  denfenseTemp: number = 0; //临时防御力
  nextEffect: Effect[] = []; //下回合结算的效果
  playNumOneTurn = 0; //回合内打出的牌数目
  curPlayCardId = -1; //当前正在打出牌的id
  allowActtackNum = 2; //一回合允许最多打n张攻击

  danger: number = -1; //打出的攻击卡即将造成的伤害 -1表示没有打出攻击卡
  emitter = new EventEmitter();
  constructor(id: string) {
    this.id = id;
    this.allCards = cloneDeep(
      cards
        .filter((item) => !item.off)
        .map((item, idx) => {
          item.id = idx;
          return item;
        })
    ) as CardData[];
  }

  //抽牌,如果牌库没牌，则判负 hurt 牌库不够时是否受伤代替抽牌
  drawCard(n: number, hurt = true) {
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

    if (diff > 0 && hurt) {
      this.health -= diff;
      this.connect?.optError("牌堆不足，受伤代替抽牌");
      this.connect?.homeHurt(0, this.health);
      this.enemy?.connect?.homeHurt(1, this.enemy.health);
      this.enemy?.connect?.optError("牌堆不足，受伤代替抽牌");
      this.tryGameOver();
    }

    this.connect?.cardStackNumUpdate(true, this.allCards.length);
    this.enemy?.connect?.cardStackNumUpdate(
      false,
      this.enemy?.allCards.length || 0
    );
  }
  turnStart() {
    this.connect?.turnStart(true);
    this.enemy?.connect?.turnStart(false);
    this.attackNumOneTurn = 0;
    this.playLimitOneTurn = Infinity;
    this.playNumOneTurn = 0;
    this.attckTemp = 0;
    this.denfenseTemp = 0;
    this.nextEffect = [];
    this.allowActtackNum = 2;
    this.drawCard(2);
    this.connect?.drawEnd();
  }
  //打出牌,要负责数据校验
  playCard(id: number) {
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
      if (this.attackNumOneTurn >= this.allowActtackNum) {
        this.connect?.optError(`一回合只能打出${this.allowActtackNum}张攻击卡`);
        return;
      }
      if (this.room?.turnIdx === 1 && this.attackNumOneTurn === 1) {
        this.connect?.optError("先手玩家首回合只能攻击一次");
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
      this.handleSpecialCard(card);
    }
    this.handCards.splice(this.handCards.indexOf(card), 1);
    this.connect?.removeCard(id);
    this.enemy?.connect?.p2RemoveCard(idx);
    this.playLimitOneTurn--;
    this.prevCard = card; // 记录上一张打出的牌
    this.tryGameOver(); // 尝试看能否结束游戏
    this.playNumOneTurn++;
    this.emitter.emit("play", this.playNumOneTurn);
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
    this.emitter.emit("turnEnd");
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
    card._tempDefense = card._tempDefense || 0;
    this.enemy?.flushAttack(card.defense + card._tempDefense);
  }
  //结算玩家打出攻击卡
  private handleAttackCard(card: AttackCardData) {
    this.curPlayCardId = card.id;
    card._tempAttack = card._tempAttack || 0;
    console.log("攻击", card.name, card.attack, card._tempAttack || 0);
    const danger = card.attack + Number(card._tempAttack);

    {
      //结算连击combo
      for (const hand of this.handCards) {
        if (
          hand.type === "attack" &&
          hand.tag3 === "CHAINABLE" &&
          hand.id !== card.id &&
          card.tag2 === hand.link
        ) {
          for (const e of hand.linkEffect || []) {
            if (e.name === "a_1") {
              const n = (e.args?.n as number) || 0;
              hand._tempAttack = hand._tempAttack || 0;
              hand._tempAttack += n;
              const curIdx = this.playNumOneTurn + 1;
              this.connect?.attackUpdate(hand.id, hand._tempAttack!);
              let exec = false;
              const clearFn = (idx: any) => {
                if (
                  idx + 1 === curIdx &&
                  hand.id !== this.curPlayCardId &&
                  !exec
                ) {
                  // 打出下张牌时清空a_1临时增加的伤害
                  exec = true;
                  hand._tempAttack! -= n;
                  this.connect?.attackUpdate(hand.id, hand._tempAttack!);
                }
              };
              this.emitter.once("play", clearFn);
              this.emitter.once("turnEnd", () => {
                if (!exec) {
                  exec = true;
                  hand._tempAttack! -= n;
                  this.connect?.attackUpdate(hand.id, hand._tempAttack!);
                  this.emitter.removeListener("play", clearFn);
                }
              });
            }
          }
        }
      }
      for (const hand of this.enemy?.handCards || []) {
        if (hand.type === "defense" && hand.buffTagert === card.tag2) {
          for (const e of hand.buffEffect || []) {
            if (e.name === "d_1") {
              const n = (e.args?.n as number) || 0;
              console.log("防御增加", n);
              hand._tempDefense = hand._tempDefense || 0;
              hand._tempDefense += n;
              this.enemy?.connect?.defenseUpdate(hand.id, hand._tempDefense!);
              const clearFn = (idx: any) => {
                hand._tempDefense! -= n;
                this.enemy?.connect?.defenseUpdate(hand.id, hand._tempDefense!);
              };
              this.emitter.once("flushAttack", clearFn);
            }
          }
        }
      }
    }
    this.danger = danger;
    const hasDefense = this.enemy?.handCards.some(
      (item) => item.type === "defense"
    );
    // 如果敌方没有防御卡，则直接结算伤害,否则等待对方打出防御卡
    if (!hasDefense) {
      this.flushAttack();
    }
  }
  flushAttack(defense: number = 0) {
    if (this.danger !== -1 && this.enemy) {
      this.enemy.health -= Math.max(
        0,
        this.danger - defense - (this.enemy?.denfenseTemp || 0)
      );
      // 结算对敌方水晶伤害
      this.connect?.homeHurt(1, this.enemy.health);
      this.enemy.connect?.homeHurt(0, this.enemy.health);
      this.danger = -1; // 结算后重置伤害值
      this.connect?.flushAttack();
      this.emitter.emit("flushAttack");
    }
  }
  //策略卡结算
  private handleSpecialCard(card: SpecialCardData) {
    for (const effect of card.effect || []) {
      if (effect.name === "s_1") {
        this.health += Number(effect.args?.n || 0);
        this.connect?.homeHurt(0, this.health);
        this.enemy?.connect?.homeHurt(1, this.health);
      } else if (effect.name === "s_2") {
        this.drawCard(Number(effect.args?.n || 0));
      } else if (effect.name === "s_3") {
        const n = Number(effect.args?.n || 0);
        this.allowActtackNum += n;
        this.emitter.once("turnEnd", () => {
          this.allowActtackNum -= n;
        });
      } else if (effect.name === "s_4") {
        const n = Number(effect.args?.n || 0);
        this.denfenseTemp += n;
      } else if (effect.name === "s_5") {
        const n = Number(effect.args?.n || 0);
        for (const hand of this.handCards) {
          if (hand.type === "defense") {
            hand._tempDefense = hand._tempDefense || 0;
            hand._tempDefense += n;
            this.connect?.defenseUpdate(hand.id, hand._tempDefense);
          }
        }
      }
    }
  }
  tryGameOver() {
    if (this.health <= 0) {
      this.connect?.gameOver("lose");
      this.enemy?.connect?.gameOver("win");
      this.room?.gameOver();
      this.connect?.close();
      this.enemy?.connect?.close();
    } else if ((this.enemy?.health || 0) <= 0) {
      this.connect?.gameOver("win");
      this.enemy?.connect?.gameOver("lose");
      this.room?.gameOver();
      this.connect?.close();
      this.enemy?.connect?.close();
    }
  }
}
