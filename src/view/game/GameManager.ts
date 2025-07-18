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

export class GameManager {
  private static instance: GameManager;

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
  allCards: CardData[] = [
    {
      id: 0,
      type: "attack",
      name: "SQL注入",
      bg: "sql_inject",
      description: "利用未过滤输入攻击数据库",
      attack: 4,
      tag1: "DIRECT_ONLY",
      tag2: "WEB_ATTACK",
      tag3: undefined,
      link: undefined,
      linkEffect: [],
      duration: 0,
    } as unknown as CardData,
    {
      id: 11,
      type: "attack",
      name: "钓鱼邮件",
      description: "诱导泄露信息",
      attack: 5,
      _tempAttack: 3,
      bg: "dyyj",
      tag1: "SPLASH",
      tag2: "SOCIAL_ENGINEERING",
      tag3: null,
      link: null,
      linkEffect: [],
      duration: 0,
    } as unknown as CardData,
    {
      id: 1,
      type: "defense",
      name: "安全培训",
      bg: "px1",
      description: "保护网络免受攻击",
      defense: 2,
      health: 3,
      _tempDefense: 0,
      buffTagert: "SOCIAL_ENGINEERING",
      buffEffect: [
        {
          name: "d_1",
          args: {
            n: 1,
          },
        },
      ],
    },
    {
      id: 2,
      type: "special",
      bg: "ldxf",
      name: "漏洞修复补丁",
      description: "恢复一个防御卡或主机2点生命值",
      effect: [
        {
          name: "s_1",
          args: {
            n: 2,
          },
        },
      ],
    },
  ];
  turnIdxZone: TurnIdxZone;
  healthZoneP1: Container;
  healthZoneP2: Container;
  static getInstance() {
    return GameManager.instance;
  }

  constructor(app: Application) {
    this.app = app;
    const vh100 = app.screen.height;
    const vw100 = app.screen.width;
    if (!GameManager.instance) {
      GameManager.instance = this;
    }
    {
      this.activeZone = new ActiveZone();
      this.activeZone.x = vw100 / 2 - ActiveZone.width / 2;
      this.activeZone.y = vh100 / 2 - ActiveZone.width / 2 - 30;
      app.stage.addChild(this.activeZone);
    }
    {
      // 初始化牌堆
      const stack = new Stack(app);

      stack.x = vw100 - 70;
      stack.y = vh100 - 240;

      const stack2 = new Stack(app);
      stack2.x = 2;
      stack2.y = 88;
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
      // 回合指示区
      this.turnIdxZone = new TurnIdxZone();
      this.turnIdxZone.x = vw100 - TurnIdxZone.width;
      this.turnIdxZone.y = vh100 / 2 - TurnIdxZone.width - 40;
      app.stage.addChild(this.turnIdxZone);
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
      //防御卡等待打出区域
    }

    {
      //test
      this.pushCard(0, [0, 0, 0, 2]);
      this.pushCard(1, [0, 0, 0, 0, 0, 0]);
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

  // 从p2手牌移除卡片
  removeCardP2(idx: number) {
    const card = this.p2HandZone.children[idx];
    if (!card) {
      return;
    }
    this.p2HandZone.removeChild(card);
    card.destroy();
    this.p2HandNum--;
    const gap = 60;
    for (let i = idx; i < this.p2HandZone.children?.length || 0; i++) {
      this.p2HandZone.children[i].x -= gap;
    }
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
    console.log(hw, "p1w");

    const maxAngles = [0, 0, 15, 20, 25, 30, 30, 30];
    const maxYs = [0, 0, 10, 10, 14, 18, 50, 50];

    const maxAngle = maxAngles[this.handCards.length] || 30;
    const length = this.p1HandZone.children.length;
    let diff = 0;
    // 如果只有一张牌，则不进行计算
    for (let i = 0; i < length && length > 1; i++) {
      const child = this.p1HandZone.children[i];
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
  //更新对方手牌的位置，扇形排列
  updateP2HandPos() {
    const maxAngles = [0, 0, 6, 10, 14, 16, 20, 20];
    const maxYs = [0, 0, 20, 10, 14, 18, 50, 50];
    const maxAngle = maxAngles[this.p2HandNum] || 30;
    const length = this.p2HandNum;
    let diff = 0;
    // 如果只有一张牌，则不进行计算
    for (let i = 0; i < length && length > 1; i++) {
      const child = this.p2HandZone.children[i];
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

    const gap = 40;
    const hw = Card.width + (this.p2HandNum - 1) * gap;
    const scale = 0.9;
    this.p2HandZone.scale.set(scale);
    const ew = this.app!.screen.width - hw * scale;
    this.p2HandZone.x = ew / 2;
    console.log(this.p2HandZone.width, "p2w");
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
