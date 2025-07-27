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
      <div
        class="absolute bottom-[40vh] left-1/2 -translate-1/2 text-[#bb7c00] text-[16px] txtmove"
      >
        积分 {{ score >= 0 ? `+${score}` : score }}
      </div>
    </div>
    <div
      class="fixed left-0 top-0 h-[100vh] w-[100vw] z-10 bg-[#060606c9]"
      v-if="coin !== -1"
    >
      <div
        class="w-[80px] h-[80px] transform-3d absolute left-1/2 -translate-x-1/2 top-[30vh] transition"
        :class="{
          coin_front: coin === 0,
          coin_back: coin === 1,
        }"
      >
        <img
          src="/assets/coin0.webp"
          width="80"
          class="absolute left-0 top-0 rotate-x-180"
          style="backface-visibility: hidden"
        />
        <img
          src="/assets/coin1.webp"
          width="80"
          style="backface-visibility: hidden"
          class="absolute left-0 top-0"
        />
      </div>

      <img
        src="/assets/front.webp"
        v-if="coin === 0"
        alt=""
        class="absolute left-1/2 -translate-x-1/2 top-[48vh] scale-[0.75] txtmove"
      />
      <img
        src="/assets/back.webp"
        v-else-if="coin === 1"
        alt=""
        class="absolute left-1/2 -translate-x-1/2 top-[48vh] scale-[0.75] txtmove"
      />
    </div>
  </div>
  <Lose ref="loseRef"></Lose>
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
import { onMounted, ref, useTemplateRef } from "vue";
import type { CardData } from "../../baseType/base";
import { showToast } from "vant";
import axios from "axios";
import { loadAssets } from "../utils/loadAssets";
import Lose from "./lose.vue";
const loseRef = useTemplateRef("loseRef");
const selfTurn = ref(true);
const time = ref(-1);

const selfWait = ref(false);
const timeWait = ref(0);
const win = ref("");
const score = ref(0);
const coin = ref(-1);

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

    const setting = new Sprite(await Assets.load("/assets/set.webp"));
    setting.width = 30;
    setting.height = 30;
    setting.x = 15;
    setting.y = 15;
    setting.interactive = true;
    setting.on("pointerup", () => {
      setTimeout(() => {
        loseRef.value?.openSet();
      }, 100);
    });
    app.stage.addChild(setting);

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
          gameManager.turnIdxZone.toggle(initData.selfTurn);
          if (initData?.self?.firstConnect) {
            coin.value = initData?.selfTurn ? 0 : 1;
            setTimeout(() => {
              coin.value = -1;
            }, 1700);
          }
        }
        {
          // 初始化牌堆
          gameManager.stackP1.updateNum(initData?.self?.stackNum || 0);
          gameManager.stackP2.updateNum(initData?.enemy?.stackNum || 0);
        }
        {
          //初始化头像
          gameManager.healthZoneP1.updateAvatar(
            initData?.self?.avatar || "/assets/ico1.webp"
          );
          if (initData.enemy?.id !== "roobot") {
            gameManager.healthZoneP2.updateAvatar(
              initData?.enemy?.avatar || "/assets/ico1.webp"
            );
          }
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
      } else if (data.type === "attackUpdate") {
        const { id, lastTempAttack } = data;
        gameManager.upCardTempAttck(id, lastTempAttack);
      } else if (data.type === "defenseUpdate") {
        const { id, lastTempDefense } = data;
        gameManager.defenseUpdate(id, lastTempDefense);
      } else if (data.type === "gameOver") {
        win.value = data.data;
        score.value = data.score;
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
.txtmove {
  animation: txtmoveA 0.7s ease-in-out forwards;
}
.coin_front {
  will-change: transform;
  animation: coin_front 0.7s ease-in-out forwards;
}
.coin_back {
  will-change: transform;
  animation: coin_back 0.7s ease-in-out forwards;
}

@keyframes coin_back {
  0% {
    transform: rotateX(0deg) translateY(0px);
  }
  50% {
    transform: rotateX(90deg) translateY(-140px);
  }
  100% {
    transform: rotateX(180deg) translateY(0px);
  }
}
@keyframes coin_front {
  0% {
    transform: rotateX(180deg) translateY(0px);
  }
  50% {
    transform: rotateX(90deg) translateY(-140px);
  }
  100% {
    transform: rotateX(0deg) translateY(0px);
  }
}
.txtmove {
  animation: move 0.4s ease-in-out;
}
@keyframes move {
  0% {
    transform: translateY(100px);
    opacity: 0.5;
  }
  100% {
    transform: translateY(0px);
    opacity: 1;
  }
}
@keyframes txtmoveA {
  from {
    transform: translateY(-100px);
    opacity: 0.5;
  }
  to {
    transform: translateY(0px);
    opacity: 1;
  }
}
</style>
