import {
  Assets,
  Container,
  FederatedPointerEvent,
  Graphics,
  Sprite,
  Text,
} from "pixi.js";
import { GameManager } from "./GameManager";
import { actionDistance, screenWidth } from "./utils";
import type { CardData } from "../../baseType/base";

let id = 0;
export class Card extends Container {
  static width = 110;
  static height = 160;
  id: number;
  isDragging: boolean = false;
  lastDragPosGlobalX: number = 0;
  lastDragPosGlobalY: number = 0;
  cardData: CardData;
  draggle: boolean = true; // 是否可以拖动
  moveCard?: Container;
  detailCard?: Container;
  txtContainer?: Container;
  detailTimer?: any;
  playDistance: number = 0;
  romveDetailStep = 0;
  constructor(x: number, y: number, cardData?: CardData) {
    super();
    this.id = id++;
    if (cardData) {
      this.cardData = cardData;
      this.pivot.set(Card.width / 2, Card.height);
      const bgt = Assets.get(cardData.bg);
      if (bgt) {
        const bg = new Sprite(bgt);
        bg.setSize(Card.width, Card.height);
        this.addChild(bg);
      } else {
        this.trySetBg();
      }
      {
        // name
        const nameContainer = new Container();
        const nameBg = new Sprite(Assets.get("card_name"));
        nameBg.setSize(78, 22);
        nameContainer.addChild(nameBg);
        nameContainer.x = 24;
        nameContainer.y = 7;
        const nameTxt = new Text({
          text: this.cardData.name,
          style: {
            fill: "#581c87",
            fontSize: 11,
          },
        });
        nameTxt.x = 10;
        nameTxt.y = 4;
        nameContainer.addChild(nameTxt);
        this.addChild(nameContainer);
      }
      {
        //数值
        const numContainer = new Container();
        const numBg = new Sprite(Assets.get("card_num"));
        numBg.setSize(28, 28);
        numContainer.addChild(numBg);
        numContainer.x = 4;
        numContainer.y = 4;
        const txtContainer = new Container();
        this.txtContainer = txtContainer;
        txtContainer.x = 8;
        txtContainer.y = 3;
        numContainer.addChild(txtContainer);
        this.addChild(numContainer);
        this.updateNum();
      }
    } else {
      this.cardData = {
        id: -1,
        name: "背面",
        type: "special",
      } as CardData;
      this.draggle = false;
      this.pivot.set(Card.width / 2, 0);

      const bg = new Sprite(Assets.get("card_back"));
      bg.setSize(Card.width, Card.height);
      this.addChild(bg);
    }
    this.x = x;
    this.y = y;

    this.interactive = true;
    const gameManager = GameManager.getInstance();
    const vh100 = gameManager.app?.screen.height || 0;
    this.playDistance = vh100 - Card.height - 10;
    this.on("pointerdown", this.dragStart.bind(this));
    this.on("pointerup", this.dragEnd.bind(this));
    this.on("pointerupoutside", this.dragEnd.bind(this));
  }
  async trySetBg() {
    const bg = await Assets.load(this.cardData.bg).catch(() => null);
    if (bg) {
      const bgSprite = new Sprite(bg);
      bgSprite.setSize(Card.width, Card.height);
      this.addChild(bgSprite);
    } else {
      const bg = new Sprite(Assets.get("card_back"));
      bg.setSize(Card.width, Card.height);
      this.addChild(bg);
    }
  }
  // 更新数值
  updateNum() {
    this.txtContainer?.removeChildren();
    let num = "~";
    let color = "#ffffff";
    if (this.cardData.type === "attack") {
      num = (
        this.cardData.attack + (this.cardData._tempAttack || 0)
      ).toString();
      if (this.cardData._tempAttack) {
        color = "#881337";
      }
    } else if (this.cardData.type === "defense") {
      num = (
        this.cardData.defense + (this.cardData._tempDefense || 0)
      ).toString();
      if (this.cardData._tempDefense) {
        color = "#064e3b";
      }
    }
    const txt = new Text({
      text: num,
      style: {
        fill: color,
        fontSize: 19,
        fontWeight: "bold",
      },
    });
    this.txtContainer?.addChild(txt);
  }
  dragStart(event: FederatedPointerEvent) {
    this.clearDetail();
    this.detailTimer = setTimeout(() => {
      this.showDetail();
    }, 500);

    if (!this.draggle) return;
    this.alpha = 0.5;
    this.isDragging = true;
    console.log(this.id);
    const newCard = new Card(this.x, this.y, this.cardData);
    this.parent.addChild(newCard);
    this.moveCard = newCard;
    const offset = event.getLocalPosition(this.parent);
    const offsetX = offset.x - this.x;
    const offsetY = offset.y - this.y;
    const newCardDragEnd = (e: FederatedPointerEvent) => {
      newCard.off("pointermove");
      newCard.off("pointerup");
      newCard.off("pointerupoutside");

      this.lastDragPosGlobalX = e.x;
      this.lastDragPosGlobalY = e.y;
      this.clearMoveCard();
    };
    newCard
      .on("pointermove", (e) => {
        if (!this.cardData) return;
        const pos = e.getLocalPosition(newCard.parent);
        newCard.x = pos.x - offsetX;
        newCard.y = pos.y - offsetY;
        const gameManager = GameManager.getInstance();
        if (e.globalY <= this.playDistance) {
          gameManager.activeZone.show();
          this.clearDetail();
        } else {
          gameManager.activeZone.hide();
        }
      })
      .on("pointerup", newCardDragEnd)
      .on("pointerupoutside", newCardDragEnd);
    newCard.emit("pointermove", event);
  }

  dragEnd(e: FederatedPointerEvent) {
    if (!this.isDragging) return;
    // 显示/隐藏打出区域
    const gameManager = GameManager.getInstance();
    gameManager.activeZone.hide();
    this.isDragging = false;
    if (this.lastDragPosGlobalY <= this.playDistance) {
      gameManager.playCard(this, e);
    }
    if (!this.destroyed) {
      this.alpha = 1;
    }
    this.clearMoveCard();
    this.clearDetail();
  }
  clearMoveCard() {
    if (this.moveCard) {
      this.parent.removeChild(this.moveCard);
      this.moveCard.destroy();
      this.moveCard = undefined;
    }
  }

  showDetail() {
    const detail = new Card(0, 0, this.cardData);
    detail.pivot.set(0, 0);
    const w = 190;
    detail.setSize(w, w * (Card.height / Card.width));
    const vw = GameManager.getInstance().app?.screen.width || 0;
    const vh = GameManager.getInstance().app?.screen.height || 0;
    detail.x = (vw - w) / 2;
    detail.y = 130;

    GameManager.getInstance().app?.stage.addChild(detail);
    this.detailCard = detail;
  }
  clearDetail() {
    clearTimeout(this.detailTimer);
    if (!this.detailCard) return;
    if (this.romveDetailStep === 0) {
      this.romveDetailStep = 1;
      return;
    }
    GameManager.getInstance().app?.stage.removeChild(this.detailCard!);
    this.detailCard?.destroy();
    this.detailCard = undefined;
  }
}
