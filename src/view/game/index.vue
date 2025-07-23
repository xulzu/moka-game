<template>
  <div class="relative">
    <div id="pixi-container" class="w-[100vw] h-[100vh]"></div>
    <div class="fixed z-10 right-0 top-[44%] translate-y-[-50%] isolate">
      <div
        @click="endTurn"
        class="w-[55px] h-[69px] transform-3d relative transition"
        :class="{
          'rotate-x-180': selfTurn,
        }"
      >
        <img
          src="/assets/self_turn.webp"
          width="55"
          class="absolute left-0 top-0 rotate-x-180"
          style="backface-visibility: hidden"
        />
        <img
          src="/assets/p2_turn.webp"
          width="55"
          style="backface-visibility: hidden"
          class="absolute left-0 top-0"
        />
      </div>
      <div
        class="w-[55px] h-[18px] mt-1 overflow-hidden relative"
        @click="debug"
      >
        <div
          class="rounded-[8px] w-[60px] h-[16px] pl-[4px] ml-[4px] bg-[#1f29378a] text-[12px] text-white flex items-center"
        >
          <img src="/assets/time.png" alt="" class="w-[12px] h-[12px] mr-1" />
          {{ time }}s
        </div>
      </div>
      <!-- <div class="text-white text-center hover:text-red-500">t:{{ time }}</div> -->
    </div>

    <div
      v-if="win"
      @click="$router.push('/')"
      class="fixed left-0 top-0 h-[100vh] w-[100vw] z-10 bg-[#060606c9]"
    >
      <img
        v-if="win === 'win'"
        src="/assets/win.webp"
        class="absolute w-[250px] left-1/2 -translate-x-1/2 top-[30vh] element"
        alt=""
      />
      <img
        v-else
        src="/assets/lose.webp"
        class="absolute w-[250px] left-1/2 -translate-x-1/2 top-[30vh] element"
        alt=""
      />
    </div>
  </div>
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
import { onMounted, ref } from "vue";
import type { CardData } from "../../baseType/base";
import { showToast } from "vant";
import axios from "axios";
import { loadAssets } from "../utils/loadAssets";

const selfTurn = ref(true);
const time = ref(0);

const selfWait = ref(false);
const timeWait = ref(0);
const win = ref("");
onMounted(() => {
  gsap.registerPlugin(PixiPlugin);
  PixiPlugin.registerPIXI(PIXI);

  (async () => {
    await loadAssets();
    // Create a new application
    const app = new Application();
    initDevtools({ app });

    // Initialize the application
    await app.init({
      background: "#1099bb",
      resizeTo: window,
      resolution: window.devicePixelRatio,
      autoDensity: true,
    });

    const bgSprite = new Sprite(Assets.get("bg"));
    bgSprite.width = app.screen.width;
    bgSprite.height = app.screen.height;
    app.stage.addChildAt(bgSprite, 0);
    // Append the application canvas to the document body
    document.getElementById("pixi-container")!.appendChild(app.canvas);
    const gameManager = new GameManager(app);

    gameManager.turnIdxZone.emitter.on("toggle", (self) => {
      selfTurn.value = self;
    });
    gameManager.turnIdxZone.emitter.on("updateTime", (time_) => {
      time.value = time_;
    });
    const sse = new EventSource("/sse/connect");
    sse.onmessage = (event) => {
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
          gameManager.pushCard(1, initData?.enemy?.handcards || []);
        }
        {
          // 初始化血量
          gameManager.healthZoneP1.updateHealth(initData?.self?.health || 20);
          gameManager.healthZoneP2.updateHealth(initData?.enemy?.health || 20);
        }
        {
          //初始化回合指示区
          console.log(initData.selfTurn, "selfTurn");
          gameManager.turnIdxZone.toggle(initData.selfTurn);
        }
        {
          // 初始化牌堆
          gameManager.stackP1.updateNum(initData?.self?.stackNum || 0);
          gameManager.stackP2.updateNum(initData?.enemy?.stackNum || 0);
        }
      } else if (data.type === "turnStart") {
        gameManager.turnIdxZone.toggle(data.self);
      } else if (data.type === "turnEndTimeout") {
        gameManager.turnIdxZone.updateTime(Number(data.data));
      } else if (data.type === "removeCard") {
        gameManager.removeCardFromHand(Number(data.data));
      } else if (data.type === "moreHandCard") {
        showToast("手牌爆辣~");
      } else if (data.type === "p2RemoveCard") {
        gameManager.removeCardP2(data.data);
      } else if (data.type === "homeHurt") {
        const lastHealth = Number(data.data.lastHealth);
        const role = Number(data.data.role);
        // 0自己 1对方
        setTimeout(() => {
          if (role === 0) {
            gameManager.healthZoneP1.updateHealth(lastHealth);
          } else {
            gameManager.healthZoneP2.updateHealth(lastHealth);
          }
        }, 500);
      } else if (data.type === "waitDefenseCard") {
        const { self, time, cardId } = data.data || {};
        gameManager.waitDefenseCard(self, time, cardId);
      } else if (data.type === "drawCard") {
        if (data.self) {
          gameManager.pushCard(0, data.data);
        } else {
          gameManager.pushCard(1, data.data);
        }
      } else if (data.type === "cardStackNumUpdate") {
        const { self, num } = data.data;
        if (self) {
          gameManager.stackP1.updateNum(num);
        } else {
          gameManager.stackP2.updateNum(num);
        }
      } else if (data.type === "playAnimation") {
        gameManager.playCardAnimation(data.data);
      } else if (data.type === "gameOver") {
        win.value = data.data;
        sse.close();
      }
    };
    sse.onerror = (event) => {
      console.log(event);
    };
  })();
});

function skipDefenseCard() {
  fetch("/api/skipDefenseCard");
}

function debug() {
  axios.get("/api/debug");
}

function endTurn() {
  GameManager.getInstance().turnIdxZone.finish();
}
</script>
<style lang="less" scoped>
@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.element {
  animation: slideDown 0.7s ease forwards;
}
</style>
