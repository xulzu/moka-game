import {
  Application,
  Assets,
  Container,
  FederatedEvent,
  FederatedPointerEvent,
  Graphics,
  Sprite,
  Text,
} from "pixi.js";
import { Card } from "./Card";
import { DefenseCard } from "./DefenseCard";
import { actionDistance, screenWidth } from "./utils";
import { Health } from "./Health";
import type {
  AttackCardData,
  CardData,
  DefenseCardData,
} from "../../baseType/base";
import { TurnIdxZone } from "./TurnIdxZone";
import { Stack } from "./Stack";
import { cloneDeep } from "lodash-es";
import { ActiveZone } from "./ActiveZone";
import { WaitDefenseZone } from "./WaitDefenseZone";
import { PlayAnimation } from "./PlayAnimation";

export class GameManager {
  static instance: GameManager;

  // 游戏状态
  private currentPlayer: "player1" | "player2" = "player1";
  private player1Health: number = 20;
  private player2Health: number = 20;
  private defenseZones: DefenseCard[] = [];
  app?: Application;
  handCards: Card[] = [];
  p2HandNum: number = 0;
  p1HandZone: Container;
  p2HandZone: Container;
  activeZone: ActiveZone;
  cardDetailZone: Container;
  allCards: CardData[] = [];
  turnIdxZone: TurnIdxZone;
  healthZoneP1: Health;
  healthZoneP2: Health;
  waitDefenseZone: WaitDefenseZone;
  stackP1: Stack;
  stackP2: Stack;
  playAnimation: PlayAnimation;
  playing = false; //打出结算中
  playAnimating?: Promise<void>; //打出动画执行中
  static getInstance() {
    return GameManager.instance;
  }

  constructor(app: Application) {
    this.app = app;
    const vh100 = app.screen.height;
    const vw100 = app.screen.width;
    GameManager.instance = this;
    {
      //打出区
      this.activeZone = new ActiveZone();
      this.activeZone.x = vw100 / 2 - ActiveZone.width / 2;
      this.activeZone.y = vh100 / 2 - ActiveZone.width / 2 - 30;
      app.stage.addChild(this.activeZone);
    }

    {
      // 初始化牌堆
      const stack = new Stack();
      stack.x = vw100 - 70;
      stack.y = vh100 - 240;

      const stack2 = new Stack();

      stack2.x = 2;
      stack2.y = 88;
      this.stackP1 = stack;
      this.stackP2 = stack2;
      app.stage.addChild(stack, stack2);
    }
    {
      //血量区初始化
      this.healthZoneP1 = new Health();
      this.healthZoneP2 = new Health();
      this.healthZoneP1.x = vw100 / 2 - Health.width / 2;
      this.healthZoneP1.y = vh100 - 270;
      this.healthZoneP2.x = vw100 / 2 - Health.width / 2;
      this.healthZoneP2.y = 120;

      app.stage.addChild(this.healthZoneP1, this.healthZoneP2);
    }
    {
      // 回合指示区;
      this.turnIdxZone = new TurnIdxZone();
      this.turnIdxZone.y = vh100 / 2 - 60;
      this.turnIdxZone.x = (vw100 - this.turnIdxZone.width) / 2;
      app.stage.addChild(this.turnIdxZone);
    }
    {
      //打出动画区
      this.playAnimation = new PlayAnimation();
      app.stage.addChild(this.playAnimation);
    }
    {
      //防御卡等待打出区域
      this.waitDefenseZone = new WaitDefenseZone();
      app.stage.addChild(this.waitDefenseZone);
    }
    {
      //卡牌详情展示区
      this.cardDetailZone = new Container();
      app.stage.addChild(this.cardDetailZone);
    }
    {
      //手牌区初始化
      const topCardContainer = new Container();
      const bottomCardContainer = new Container();
      app.stage.addChild(topCardContainer, bottomCardContainer);
      topCardContainer.x = 0;
      topCardContainer.y = -50;
      bottomCardContainer.x = 20;
      bottomCardContainer.y = vh100 - 180;
      this.p1HandZone = bottomCardContainer;
      this.p2HandZone = topCardContainer;
    }

    {
      //test
      // this.pushCard(0, [1]);
    }
    {
      //初始化事件
      window.addEventListener("click", () => {
        this.cardDetailZone.removeChildren();
      });
    }
  }

  getDefenseZones() {
    return this.defenseZones;
  }

  pushHandCard(...cards: Card[]) {
    this.handCards.push(...cards);
  }

  async playCard(card: Card) {
    console.log(`打出卡片: ${card.cardData.name} (${card.cardData.type})`);
    fetch("/api/play?id=" + card.cardData.id + "&user=230250");
  }
  drawCard(n: number) {
    throw new Error("not implemented");
  }
  showPlayer2NextCard() {
    throw new Error("not implemented");
  }

  // 处理防御卡
  setDefenseCard(zoneIndex: number, id: number | null) {
    const defenseZone = this.defenseZones[zoneIndex];
    const card = this.allCards.find((item) => item.id === id);
    if (!defenseZone || !card || card.type !== "defense") {
      return;
    }
    defenseZone.activeZone(card as DefenseCardData);
  }

  // 处理策略卡
  private handleSpecialCard(card: Card) {
    console.log(`处理策略卡: ${card.cardData.name}`);
    // 根据标签处理不同效果
  }

  // 从p1手牌移除卡片
  removeCardFromHand(id: number) {
    const card = this.handCards.find((item) => item.cardData.id === id);
    if (!card) {
      return;
    }
    const index = this.handCards.indexOf(card);
    if (index !== -1) {
      this.handCards.splice(index, 1);
    }
    if (card.parent) {
      card.parent.removeChild(card);
      card.destroy();
    }
    this.updateP1HandPos();
  }

  // 从p2手牌移除卡片
  removeCardP2(idx: number) {
    const card = this.p2HandZone.children[idx];
    if (!card) {
      return;
    }
    this.p2HandZone.removeChild(card);
    card.destroy();
    this.p2HandNum--;
    this.updateP2HandPos();
  }
  // 抽牌 0 自己 1 对方
  pushCard(role: 0 | 1, cardIds: number[]) {
    if (role === 0) {
      const p1Gap = 40;
      let x = this.handCards.length * p1Gap;
      if (x === 0) {
        x = Card.width / 2;
      }
      cardIds.forEach((item) => {
        const cardData = this.allCards.find((card) => card.id === item);
        const card = new Card(x, Card.height, cloneDeep(cardData));
        x += p1Gap;
        this.pushHandCard(card);
        this.p1HandZone.addChild(card);
      });
      this.updateP1HandPos();
    } else {
      const p2Gap = 40;
      let x = this.p2HandNum * p2Gap;
      if (x === 0) {
        x = Card.width / 2;
      }
      this.p2HandNum += cardIds.length;
      for (let i = 0; i < cardIds.length; i++) {
        const card = new Card(x, 0);
        x += p2Gap;
        this.p2HandZone.addChild(card);
      }
      this.updateP2HandPos();
    }
  }
  //更新自己手牌的位置，扇形排列
  updateP1HandPos() {
    const gap = 40;
    const hw = Card.width + (this.handCards.length - 1) * gap;
    const ew = this.app!.screen.width - hw;
    this.p1HandZone.x = ew / 2;
    const p1Gap = 40;
    const maxAngles = [0, 0, 15, 20, 25, 30, 30, 30];
    const maxYs = [0, 0, 10, 10, 14, 18, 50, 50];

    const maxAngle = maxAngles[this.handCards.length] || 30;
    const length = this.p1HandZone.children.length;
    let diff = 0;
    let x = Card.width / 2;
    // 如果只有一张牌，则不进行计算
    for (let i = 0; i < length; i++) {
      const child = this.p1HandZone.children[i];
      child.alpha = 1;
      child.x = x;
      child.y = Card.height;
      x += p1Gap;
      child.angle = 0;
      if (length > 1) {
        const t = i / (length - 1);
        const angle = (t - 0.5) * maxAngle;
        child.angle = angle;
        const rad = ((t - 0.5) * 90 * Math.PI) / 180;
        const cosValue = Math.cos(rad);
        const ny = cosValue * (maxYs[this.handCards.length] || 30);
        if (i === 0) {
          diff = ny;
        }
        child.y -= ny - diff;
      }
    }
  }
  //更新对方手牌的位置，扇形排列
  updateP2HandPos() {
    const maxAngles = [0, 0, 6, 10, 14, 16, 20, 20];
    const maxYs = [0, 0, 20, 10, 14, 18, 50, 50];
    const maxAngle = maxAngles[this.p2HandNum] || 30;
    const length = this.p2HandNum;
    let diff = 0;
    let x = Card.width / 2;
    // 如果只有一张牌，则不进行计算
    for (let i = 0; i < length; i++) {
      const child = this.p2HandZone.children[i];
      child.x = x;
      child.y = 0;
      x += 40;
      child.angle = 0;
      if (length > 1) {
        const t = i / (length - 1);
        const angle = (t - 0.5) * maxAngle;
        child.angle = -angle;
        const rad = ((t - 0.5) * 90 * Math.PI) / 180;
        const cosValue = Math.cos(rad);
        const ny = cosValue * (maxYs[this.p2HandNum] || 30);
        if (i === 0) {
          diff = ny;
        }
        child.y += ny - diff;
      }
    }

    const gap = 40;
    const hw = Card.width + (this.p2HandNum - 1) * gap;
    const scale = 0.9;
    this.p2HandZone.scale.set(scale);
    const ew = this.app!.screen.width - hw * scale;
    this.p2HandZone.x = ew / 2;
    console.log(this.p2HandZone.width, "p2w");
  }

  waitDefenseCard(self: boolean, time: number, cardId: number) {
    const healthZone = self ? this.healthZoneP1 : this.healthZoneP2;
    if (time) {
      healthZone.showMoveLight();
    } else {
      healthZone.hideMoveLight();
    }
    const card = this.allCards.find((item) => item.id === cardId);
    if (time === 0 || !card) {
      this.waitDefenseZone.visible = false;
      return;
    }
    this.waitDefenseZone.updateTime(self, time, card as AttackCardData);
  }
  // 播放打出动画
  playCardAnimation(id: number) {
    const card = this.allCards.find((item) => item.id === id);
    if (!card) {
      console.log("播放效果，但没卡牌");
      return;
    }
    this.playAnimation.play(card);
  }
  //更新攻击牌的临时攻击力
  upCardTempAttck(id: number, lastTempAttack: number) {
    const hand = this.handCards.find((item) => item.cardData.id === id);
    if (!hand || hand.cardData.type !== "attack") {
      return;
    }
    hand.cardData._tempAttack = lastTempAttack;
    hand.updateNum();
  }
  defenseUpdate(id: number, lastTempDefense: number) {
    const hand = this.handCards.find((item) => item.cardData.id === id);
    if (!hand || hand.cardData.type !== "defense") {
      return;
    }
    hand.cardData._tempDefense = lastTempDefense;
    hand.updateNum();
  }
  // 获取游戏状态（用于UI更新）
  getGameState() {
    return {
      currentPlayer: this.currentPlayer,
      player1Health: this.player1Health,
      player2Health: this.player2Health,
    };
  }
}
