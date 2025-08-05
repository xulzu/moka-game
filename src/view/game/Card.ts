import {
  Application,
  Assets,
  Container,
  FederatedPointerEvent,
  Graphics,
  Sprite,
  Text,
  TextStyle,
} from "pixi.js";
import { GameManager } from "./GameManager";
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
  moveCard?: Card;
  txtContainer?: Container;
  numContainer?: Container;
  detailTimer?: any;
  playDistance: number = 0;
  romveDetailStep = 0;
  preClickTime = 0;
  dragPos?: [number, number];
  _boundUpdateDragPos?: () => void;
  constructor(x: number, y: number, cardData?: CardData, app?: Application) {
    super();
    this.id = id++;
    if (cardData) {
      this.cardData = cardData;
      this.pivot.set(Card.width / 2, Card.height);
      const bgt = Assets.get(cardData.bg);
      if (bgt) {
        const bg = new Sprite(bgt);
        bg.texture.source.scaleMode = "nearest";
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
            fontFamily: "SimSun",
          },
          resolution: 4,
        });
        nameTxt.x = 10;
        nameTxt.y = 5;
        nameContainer.addChild(nameTxt);
        this.addChild(nameContainer);
      }
      {
        //数值
        const numContainer = new Container();
        this.numContainer = numContainer;
        const bgMap = {
          attack: "card_num",
          defense: "card_num_blue",
          special: "card_num_green",
        };
        const bg = bgMap[cardData.type] || bgMap.attack;
        const numBg = new Sprite(Assets.get(bg));
        numBg.setSize(28, 28);
        numContainer.addChild(numBg);
        numContainer.x = 4;
        numContainer.y = 4;
        const txtContainer = new Container();
        this.txtContainer = txtContainer;
        txtContainer.y = 1;
        numContainer.addChild(txtContainer);
        this.addChild(numContainer);

        if (cardData.type === "special") {
          //添加策略卡的星星
          const starSprite = new Sprite(Assets.get("star"));
          starSprite.setSize(18, 18);
          starSprite.x = (numContainer.width - starSprite.width) / 2;
          starSprite.y = (numContainer.height - starSprite.height) / 2;
          numContainer.addChild(starSprite);
        }

        this.updateNum();
      }
      {
        //描述
        const descContainer = new Container();
        const txtMap = {
          WEB_ATTACK: "web攻击",
          SYSTEM_EXPLOIT: "系统漏洞",
          SOCIAL_ENGINEERING: "社工",
        };
        if (cardData.type === "attack" && cardData.tag2 in txtMap) {
          const txt = new Text({
            text: `[${txtMap[cardData.tag2]}]`,
            style: {
              fontSize: 10,
              fill: "#fff",
              wordWrap: true,
              wordWrapWidth: Card.width - 10,
              breakWords: true,
              fontFamily: "SimSun",
            },
            resolution: 4,
          });
          txt.y = -12;
          descContainer.addChild(txt);
        }
        if (cardData.description) {
          const txt = new Text({
            text: cardData.description,
            style: {
              fontSize: 10,
              fill: "#fff",
              wordWrap: true,
              wordWrapWidth: Card.width - 10,
              breakWords: true,
              fontFamily: "SimSun",
            },
            resolution: 4,
          });
          descContainer.addChild(txt);
        }
        descContainer.y = Card.height - 55;
        descContainer.x = 5;
        this.addChild(descContainer);
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
    const gameManager = app ? void 0 : GameManager.getInstance();
    const vh100 = app
      ? app.screen.height
      : gameManager?.app?.screen.height || 0;
    this.playDistance = vh100 - Card.height - 10;
    this.on("pointerdown", this.dragStart.bind(this));
    this.on("pointerup", this.dragEnd.bind(this));
    this.on("pointerupoutside", this.dragEnd.bind(this));
    this._boundUpdateDragPos = this.updateDragPos.bind(this);
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
    if (this.txtContainer) {
      if (this.cardData.type === "special") return;
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
        resolution: 4,
      });
      this.txtContainer?.addChild(txt);
      this.txtContainer.x =
        (this.numContainer!.width - this.txtContainer.width) / 2;
      this.txtContainer.y =
        (this.numContainer!.height - this.txtContainer.height) / 2;
    }
  }
  dragStart(event: FederatedPointerEvent) {
    if (!this.draggle) return;
    const time = Date.now();
    if (time - this.preClickTime <= 250) {
      // 双击直接打出
      GameManager.getInstance().playCard(this);
      return;
    }
    this.preClickTime = time;
    this.clearDetail();
    this.detailTimer = setTimeout(() => {
      this.showDetail();
    }, 500);

    this.alpha = 0.5;
    this.isDragging = true;
    const newCard = new Card(this.x, this.y, this.cardData);
    this.parent.addChild(newCard);
    this.moveCard = newCard;
    const offset = event.getLocalPosition(this.parent);
    const offsetX = offset.x - this.x;
    const offsetY = offset.y - this.y;
    GameManager.getInstance().app.ticker.add(this._boundUpdateDragPos);
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
        // newCard.x = pos.x - offsetX;
        // newCard.y = pos.y - offsetY;
        this.dragPos = [pos.x - offsetX, pos.y - offsetY];

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

  dragEnd() {
    if (!this.isDragging) return;
    // 显示/隐藏打出区域
    const gameManager = GameManager.getInstance();
    gameManager.activeZone.hide();
    this.isDragging = false;
    GameManager.getInstance().app.ticker.remove(this._boundUpdateDragPos);
    this.dragPos = void 0;
    if (this.lastDragPosGlobalY <= this.playDistance) {
      gameManager.playCard(this);
    }
    if (!this.destroyed) {
      this.alpha = 1;
    }
    this.clearMoveCard();
    this.clearDetail();
  }
  updateDragPos() {
    if (this.isDragging && this.moveCard && this.dragPos) {
      const [tx, ty] = this.dragPos;
      this.moveCard.x = tx;
      this.moveCard.y = ty;
    }
  }
  clearMoveCard() {
    if (this.moveCard) {
      this.parent.removeChild(this.moveCard);
      this.moveCard.destroy();
      this.moveCard = undefined;
    }
  }

  showDetail() {
    this.romveDetailStep = 0;
    const detail = new Card(0, 0, this.cardData);
    detail.pivot.set(0, 0);
    detail.draggle = false;
    const w = 190;
    detail.setSize(w, w * (Card.height / Card.width));
    const vw = GameManager.getInstance().app?.screen.width || 0;
    detail.x = (vw - w) / 2;
    detail.y = 130;

    GameManager.getInstance().cardDetailZone.addChild(detail);
  }
  clearDetail() {
    clearTimeout(this.detailTimer);
    if (this.romveDetailStep === 0) {
      this.romveDetailStep = 1;
      return;
    }
    GameManager.getInstance().cardDetailZone.removeChildren();
  }
}
