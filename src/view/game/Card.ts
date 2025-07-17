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
  id: number;
  isDragging: boolean = false;
  lastDragPosGlobalX: number = 0;
  lastDragPosGlobalY: number = 0;
  cardData: CardData;
  draggle: boolean = true; // 是否可以拖动

  constructor(x: number, y: number, cardData?: CardData) {
    super();
    this.id = id++;
    if (cardData) {
      this.cardData = cardData;
    } else {
      this.cardData = {
        id: -1,
        name: "背面",
        type: "special",
      } as CardData;
      this.draggle = false;
    }
    this.x = x;
    this.y = y;

    const bg = new Sprite(Assets.get("sql"));
    bg.setSize(130, 180);
    console.log(bg.width, bg.height);
    this.addChild(bg);
    {
      // name
      const nameContainer = new Container();
      const nameBg = new Sprite(Assets.get("card_name"));
      nameBg.setSize(80, 26);
      nameContainer.addChild(nameBg);
      nameContainer.x = 30;
      nameContainer.y = 8;
      const nameTxt = new Text({
        text: this.cardData.name,
        style: {
          fill: "#7e22ce",
          fontSize: 12,
          fontWeight: "bold",
        },
      });
      nameTxt.x = 12;
      nameTxt.y = 5;
      nameContainer.addChild(nameTxt);
      this.addChild(nameContainer);
    }
    {
      //数值
      const numContainer = new Container();
      const numBg = new Sprite(Assets.get("card_num"));
      numBg.setSize(35, 35);
      numContainer.addChild(numBg);
      numContainer.x = 4;
      numContainer.y = 4;
      const txtContainer = new Container();
      const txt = new Text({
        text: 4,
        style: {
          fill: "#ffffff",
          fontSize: 26,
          fontWeight: "bold",
        },
      });
      txtContainer.addChild(txt);
      txtContainer.x = 9;
      txtContainer.y = 3;
      numContainer.addChild(txtContainer);
      this.addChild(numContainer);
    }

    this.interactive = true;
    this.on("pointerdown", this.dragStart.bind(this));
    this.on("touchend", this.dragEnd.bind(this));
    this.on("touchendoutside", this.dragEnd.bind(this));
  }
  dragStart(event: FederatedPointerEvent) {
    if (!this.draggle) return;
    this.alpha = 0.5;
    this.isDragging = true;
    console.log(this.id);
    const newCard = new Card(this.x, this.y, this.cardData);
    this.parent.addChild(newCard);
    const offset = event.getLocalPosition(this.parent);
    const offsetX = offset.x - this.x;
    const offsetY = offset.y - this.y;
    const newCardDragEnd = (e: FederatedPointerEvent) => {
      newCard.off("pointermove");
      newCard.off("pointerup");
      newCard.off("pointerupoutside");

      this.lastDragPosGlobalX = e.x;
      this.lastDragPosGlobalY = e.y;
      this.parent.removeChild(newCard);
      newCard.destroy();
    };
    newCard
      .on("pointermove", (e) => {
        if (!this.cardData) return;
        const pos = e.getLocalPosition(newCard.parent);
        newCard.x = pos.x - offsetX;
        newCard.y = pos.y - offsetY;
        const defenseZones = GameManager.getInstance().getDefenseZones();
        const zone_0 = defenseZones[0];
        const zone_1 = defenseZones[1];

        const zone_2 = defenseZones[2];
        const zone_3 = defenseZones[3];

        if (this.cardData.type === "defense" && e.globalY <= actionDistance) {
          // 优先放左侧
          if (zone_0?.isEmpty) {
            zone_0?.highlight(true);
            zone_1?.highlight(false);
          } else if (zone_1?.isEmpty) {
            zone_0?.highlight(false);
            zone_1?.highlight(true);
          }
        } else if (
          this.cardData.type === "attack" &&
          e.globalY <= actionDistance
        ) {
          if (!zone_2?.isEmpty && e.globalX < screenWidth / 2) {
            zone_2?.highlight(true);
            zone_3?.highlight(false);
          } else if (!zone_3?.isEmpty && e.globalX > screenWidth / 2) {
            zone_2?.highlight(false);
            zone_3?.highlight(true);
          }
        } else {
          zone_0?.highlight(false);
          zone_1?.highlight(false);
          zone_2?.highlight(false);
          zone_3?.highlight(false);
        }
      })
      .on("pointerup", newCardDragEnd)
      .on("pointerupoutside", newCardDragEnd);
    newCard.emit("pointermove", event);
  }

  dragEnd(e: FederatedPointerEvent) {
    if (!this.isDragging) return;
    // 取消防御卡区域的highlight
    const defenseZones = GameManager.getInstance().getDefenseZones();
    const zone_0 = defenseZones[0];
    const zone_1 = defenseZones[1];
    const zone_2 = defenseZones[2];
    const zone_3 = defenseZones[3];
    zone_0?.highlight(false);
    zone_1?.highlight(false);
    zone_2?.highlight(false);
    zone_3?.highlight(false);
    this.isDragging = false;
    const gameManager = GameManager.getInstance();
    if (this.lastDragPosGlobalY <= actionDistance) {
      gameManager.playCard(this, e);
    }
    if (this && !this.destroyed) {
      this.alpha = 1;
    }
  }
}
