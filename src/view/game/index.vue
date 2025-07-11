<template>
  <div id="pixi-container" class="w-[100vw] h-[100vh]"></div>
</template>
<script lang="ts" setup>
import {
  Application,
  Assets,
  Container,
  Graphics,
  Sprite,
  Text,
} from "pixi.js";
import * as PIXI from "pixi.js";
import { initDevtools } from "@pixi/devtools";
import { DefenseCard } from "./DefenseCard";
import { Card } from "./Card";
import { Health } from "./Health";
import { GameManager } from "./GameManager";
import { gsap } from "gsap";
import { PixiPlugin } from "gsap/PixiPlugin";
import { onMounted } from "vue";
import type { CardData } from "../../baseType/base";
import { showToast } from "vant";

onMounted(() => {
  gsap.registerPlugin(PixiPlugin);
  PixiPlugin.registerPIXI(PIXI);

  (async () => {
    // Create a new application
    const app = new Application();
    initDevtools({ app });

    // Initialize the application
    await app.init({ background: "#1099bb", resizeTo: window });

    // Append the application canvas to the document body
    document.getElementById("pixi-container")!.appendChild(app.canvas);
    const gameManager = new GameManager(app);
    // Load the bunny texture
    const texture = await Assets.load("/assets/bunny.png");

    // Create a bunny Sprite
    const bunny = new Sprite(texture);

    // Center the sprite's anchor point
    bunny.anchor.set(0.5);

    // Move the sprite to the center of the screen
    bunny.position.set(app.screen.width / 2, app.screen.height / 2);

    // Add the bunny to the stage
    app.stage.addChild(bunny);

    console.log(app.screen.width, app.screen.height);
    // Listen for animate update
    app.ticker.add((time) => {
      // Just for fun, let's rotate mr rabbit a little.
      // * Delta is 1 if running at 100% performance *
      // * Creates frame-independent transformation *
      bunny.rotation += 0.1 * time.deltaTime;
    });
    console.log(111);
    const sse = new EventSource("/sse/connect");
    sse.onmessage = (event) => {
      console.log(event.data);
      const data = JSON.parse(event.data);
      if (data.type === "error") {
        showToast(data.data);
      } else if (data.type === "initGame") {
        console.log(data.data);
        const initData = data.data;
        gameManager.allCards = initData?.cards || [];
        {
          // 初始化手牌
          gameManager.pushCard(0, initData?.self?.handcards || []);
        }
        {
          // 初始化防御卡
          if (initData.self?.defenseCards[0] !== null) {
            gameManager.setDefenseCard(0, initData.self?.defenseCards[0]);
          }
          if (initData.self?.defenseCards[1] !== null) {
            gameManager.setDefenseCard(1, initData.self?.defenseCards[1]);
          }
          if (initData.enemy?.defenseCards[0] !== null) {
            gameManager.setDefenseCard(2, initData.enemy?.defenseCards[0]);
          }
          if (initData.enemy?.defenseCards[1] !== null) {
            gameManager.setDefenseCard(3, initData.enemy?.defenseCards[1]);
          }
        }
        {
          // 初始化血量
          gameManager.updateHealth(0, Number(initData.self?.health || 0));
          gameManager.updateHealth(1, Number(initData.enemy?.health || 0));
        }
      } else if (data.type === "removeCard") {
        gameManager.removeCardFromHand(Number(data.data));
      } else if (data.type === "setDefenseCard") {
        const zoneIndex = Number(data.data.zoneIndex);
        const id = Number(data.data.id);
        gameManager.setDefenseCard(zoneIndex, id);
      } else if (data.type === "defenseCardHurt") {
        const zoneIndex = Number(data.data.zoneIndex);
        const lastHealth = Number(data.data.lastHealth);
        gameManager.defenseCardHurt(zoneIndex, lastHealth);
      }
    };
    sse.onerror = (event) => {
      console.log(event);
    };
    sse.addEventListener("error", (event: any) => {
      sse.close();
      showToast(event?.data);
    });
  })();
});
</script>
<style lang="less" scoped></style>
