import { Container } from "pixi.js";
import type { CardData } from "../../baseType/base";
import { Card } from "./Card";
import { GameManager } from "./GameManager";
import gsap from "gsap";
export class PlayAnimation extends Container {
  constructor() {
    super();
  }
  play(cardData: CardData) {
    const card = new Card(0, 0, cardData);
    card.draggle = false;
    card.setSize(120, 120 * (Card.height / Card.width));
    card.pivot.set(0, Card.height / 2);
    const vw = GameManager.getInstance().app?.screen.width || 0;
    const vh = GameManager.getInstance().app?.screen.height || 0;
    card.x = (vw - card.width) / 2;
    card.y = vh / 2 - 40;
    this.addChild(card);
    gsap.to(card, {
      pixi: {
        x: 0,
        scale: 0,
        alpha: 0.3,
      },
      duration: 0.4,
      delay: 0.5,
      onComplete: () => {
        this.removeChild(card);
      },
    });
  }
}
