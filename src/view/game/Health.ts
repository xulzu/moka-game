import { Graphics, Text } from "pixi.js";
import gsap from "gsap";
import { GameManager } from "./GameManager";
export class Health extends Graphics {
  private healthText: Text;
  private currentHealth: number = 20;
  private maxHealth: number = 20;
  private isPlayer1: boolean;

  constructor(x: number, y: number, isPlayer1: boolean = true) {
    super();
    this.x = x;
    this.y = y;
    this.isPlayer1 = isPlayer1;
    this.currentHealth = 20;
    this.maxHealth = 20;

    this.drawHealth();

    // 创建血量文本
    this.healthText = new Text({
      text: `${this.currentHealth}/${this.maxHealth}`,
      x: -14,
      y: -6,
      style: {
        fontSize: 12,
        fontFamily: "Arial",
        fill: "white",
        align: "center",
        fontWeight: "bold",
      },
    });
    this.addChild(this.healthText);
  }

  private drawHealth() {
    this.clear();

    // 根据血量比例改变颜色
    const healthRatio = this.currentHealth / this.maxHealth;
    let color = "green";
    if (healthRatio <= 0.3) {
      color = "red";
    } else if (healthRatio <= 0.6) {
      color = "orange";
    }

    // 绘制血量圆圈
    this.circle(0, 0, 20)
      .stroke({
        width: 2,
        color: "white",
      })
      .fill(color);

    // 绘制血量条
    const barWidth = 40;
    const barHeight = 6;
    const barX = -barWidth / 2;
    const barY = 25;

    // 背景条
    this.rect(barX, barY, barWidth, barHeight).fill("#333333");

    // 血量条
    const currentBarWidth = (this.currentHealth / this.maxHealth) * barWidth;
    this.rect(barX, barY, currentBarWidth, barHeight).fill(color);
  }

  //受到伤害，更新ui
  update() {
    const gameManager = GameManager.getInstance();
    const gameState = gameManager.getGameState();
    const newHealth = this.isPlayer1
      ? gameState.player1Health
      : gameState.player2Health;

    if (newHealth !== this.currentHealth) {
      this.currentHealth = newHealth;
      this.updateDisplay();
    }
  }

  private updateDisplay() {
    // 更新血量文本
    this.healthText.text = `${this.currentHealth}/${this.maxHealth}`;

    // 重新绘制血量显示
    this.drawHealth();

    // 添加血量变化动画效果
    this.addHealthChangeAnimation();
  }

  private addHealthChangeAnimation() {
    // 简单的缩放动画
    this.scale.set(1.2);
    gsap.to(this, {
      pixi: {
        scale: 1,
      },
      duration: 0.1,
    });
  }

  // 手动设置血量（用于初始化）
  setHealth(health: number) {
    this.currentHealth = health;
    this.updateDisplay();
  }

  // 获取当前血量
  getHealth(): number {
    return this.currentHealth;
  }
}
