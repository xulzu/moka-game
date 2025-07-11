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

export class GameManager {
  private static instance: GameManager;

  // 游戏状态
  private currentPlayer: "player1" | "player2" = "player1";
  private player1Health: number = 20;
  private player2Health: number = 20;
  private defenseZones: DefenseCard[] = [];
  private healthZones: Health[] = []; //[player1-HP,player2-HP]
  private app?: Application;
  handCards: Card[] = [];
  p1HandZone: Container;
  p2HandZone: Container;
  allCards: CardData[] = [];
  static getInstance() {
    return GameManager.instance;
  }

  constructor(app: Application) {
    this.app = app;
    if (!GameManager.instance) {
      GameManager.instance = this;
    }
    {
      //防御区初始化
      const topDefenseContainer = new Container();
      const bottomDefenseContainer = new Container();
      app.stage.addChild(topDefenseContainer, bottomDefenseContainer);
      topDefenseContainer.x = 70;
      topDefenseContainer.y = 160;
      bottomDefenseContainer.x = 70;
      bottomDefenseContainer.y = 330;
      // 创建只有边框的矩形
      const defenseCard0 = new DefenseCard(0, 0, 0);
      const defenseCard1 = new DefenseCard(140, 0, 1);
      const defenseCard2 = new DefenseCard(0, 0, 2);
      const defenseCard3 = new DefenseCard(140, 0, 3);
      topDefenseContainer.addChild(defenseCard2, defenseCard3);
      bottomDefenseContainer.addChild(defenseCard0, defenseCard1);
      this.defenseZones = [
        defenseCard0,
        defenseCard1,
        defenseCard2,
        defenseCard3,
      ];
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
      const health1 = new Health(340, 620, true);
      app.stage.addChild(health1);
      const health2 = new Health(30, 30, false);
      app.stage.addChild(health2);
      this.healthZones = [health1, health2];
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

    // // 根据真实卡片类型处理效果
    // switch (card.cardData.type) {
    //   case "attack":
    //     this.handleAttackCard(card, event);
    //     break;
    //   case "defense":
    //     this.handleDefenseCard(card, event);
    //     break;
    //   case "special":
    //     this.handleSpecialCard(card);
    //     break;
    //   default:
    //     console.log("未知卡片类型");
    // }
    // // 从手牌移除
    // this.removeCardFromHand(card);
  }
  drawCard(n: number) {
    throw new Error("not implemented");
  }
  showPlayer2NextCard() {
    throw new Error("not implemented");
  }

  // 处理攻击卡
  private handleAttackCard(card: Card, event: FederatedPointerEvent) {
    console.log(`处理攻击卡: ${card.cardData.name}`);
    const attackCardData = card.cardData as AttackCardData;
    const damage = attackCardData.attack || 0;
    const defenseCard0 = this.defenseZones.find((zone) => zone.id === 0);
    const defenseCard1 = this.defenseZones.find((zone) => zone.id === 1);

    let matchDefenseCard: DefenseCardData | null = null;
    (() => {
      if (defenseCard0?.isEmpty && defenseCard1?.isEmpty) {
        // return;
        this.player2Health -= damage;
        console.log(`造成 ${damage} 点伤害，对手血量: ${this.player2Health}`);
        return;
      }
      //如果只有0号防御区有卡，或者点击在0号防御区，则攻击0号防御区
      if (defenseCard1?.isEmpty || event.globalX <= screenWidth * 0.5) {
        defenseCard0?.attacked(damage);
        matchDefenseCard = defenseCard0!.defenseData!;
        return;
      }
      //如果只有1号防御区有卡，或者点击在1号防御区，则攻击1号防御区
      if (defenseCard0?.isEmpty || event.globalX > screenWidth * 0.5) {
        defenseCard1?.attacked(damage);
        matchDefenseCard = defenseCard1!.defenseData!;
        return;
      }
    })();
    //穿透攻击溢出伤害会同时攻击玩家和防御卡
    if (matchDefenseCard && attackCardData.tag1 === "SPLASH") {
      this.player2Health -= Math.max(
        0,
        attackCardData.attack - matchDefenseCard.defense
      );
    }

    this.healthZones[0].update();
    this.healthZones[1].update();
    // 检查游戏结束
    if (this.player2Health <= 0) {
      console.log("游戏结束！玩家1获胜！");
    }
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
    }
  }
  defenseCardHurt(zoneIndex: number, lastHealth: number) {
    this.defenseZones[zoneIndex].attacked(lastHealth);
  }
  updateHealth(role: 0 | 1, health: number) {
    if (role === 0) {
      this.player1Health = health;
      this.healthZones[0].update();
    } else {
      this.player2Health = health;
      this.healthZones[1].update();
    }
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
