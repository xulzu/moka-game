import {
  Application,
  Container,
  FederatedEvent,
  FederatedPointerEvent,
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

export class GameManager {
  private static instance: GameManager;

  // 游戏状态
  private currentPlayer: "player1" | "player2" = "player1";
  private player1Health: number = 20;
  private player2Health: number = 20;
  private defenseZones: DefenseCard[] = [];
  private app?: Application;
  handCards: Card[] = [];
  p2HandNum: number = 0;
  p1HandZone: Container;
  p2HandZone: Container;
  allCards: CardData[] = [];
  turnIdxZone: TurnIdxZone;
  healthManager: Health;
  static getInstance() {
    return GameManager.instance;
  }

  constructor(app: Application) {
    this.app = app;
    if (!GameManager.instance) {
      GameManager.instance = this;
    }
    {
      //手牌区初始化
      const topCardContainer = new Container();
      const bottomCardContainer = new Container();
      app.stage.addChild(topCardContainer, bottomCardContainer);
      topCardContainer.x = 0;
      topCardContainer.y = 0;
      bottomCardContainer.x = 0;
      bottomCardContainer.y = 530;
      this.p1HandZone = bottomCardContainer;
      this.p2HandZone = topCardContainer;
    }
    {
      //血量区初始化
      this.healthManager = new Health();
    }
    {
      //防御卡等待打出区域
    }
    {
      // 回合指示区
      this.turnIdxZone = new TurnIdxZone();
    }
  }

  getDefenseZones() {
    return this.defenseZones;
  }

  pushHandCard(...cards: Card[]) {
    this.handCards.push(...cards);
  }

  playCard(card: Card, event: FederatedPointerEvent) {
    console.log(`打出卡片: ${card.cardData.name} (${card.cardData.type})`);
    console.log(`卡片数据:`, card.cardData);
    const zoneIndex = event.globalX <= screenWidth * 0.5 ? 0 : 1;
    fetch(
      "/api/play?zoneIndex=" +
        zoneIndex +
        "&id=" +
        card.cardData.id +
        "&user=230250"
    );
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
    console.log("移除卡牌", index);
    if (index !== -1) {
      this.handCards.splice(index, 1);
    }
    if (card.parent) {
      card.parent.removeChild(card);
      card.destroy();
    }
    const gap = 60;
    for (let i = index; i < this.handCards.length; i++) {
      const moveX = this.handCards[i].x - gap;
      this.handCards[i].x = moveX;
    }
  }
  pushCard(role: 0 | 1, cardIds: number[]) {
    if (role === 0) {
      const cards = this.allCards.filter((item) => cardIds.includes(item.id));
      let x = this.handCards.length * 60;
      cards.forEach((item) => {
        const card = new Card(x, 0, item);
        x += 60;
        this.pushHandCard(card);
        this.p1HandZone.addChild(card);
      });
    } else {
      this.p2HandNum += cardIds.length;
      //对方玩家抽牌
    }
  }

  waitDefenseCard(self: boolean, time: number) {}
  // 获取游戏状态（用于UI更新）
  getGameState() {
    return {
      currentPlayer: this.currentPlayer,
      player1Health: this.player1Health,
      player2Health: this.player2Health,
    };
  }
}
