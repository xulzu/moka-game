<template>
  <div class="relative">
    <div id="pixi-container" class="w-[100vw] h-[100vh]"></div>
    <div class="fixed z-2 right-2 top-[40%] translate-y-[-50%]">
      <div
        class="h-[40px] leading-[14px] p-2 text-[12px] flex flex-col items-center justify-center w-[40px] bg-red-500 rounded-[50%]"
        v-if="selfTurn"
        @click="endTurn"
      >
        <div>结束</div>
        <div>回合</div>
      </div>
      <div
        class="h-[40px] leading-[14px] p-2 text-[12px] flex flex-col items-center justify-center w-[40px] bg-red-500 rounded-[50%]"
        v-else
      >
        <div>对方</div>
        <div>回合</div>
      </div>
      <div class="text-white text-center">t:{{ time }}</div>
    </div>
    <div
      class="fixed z-2 top-[25vh] left-[50vw] -translate-x-[50%] flex items-center justify-center h-[50px] w-[50px] bg-green-500 rounded-[4px]"
    >
      {{ health2 }}
    </div>
    <div
      @click="debug"
      class="fixed z-2 bottom-[25vh] left-[50vw] -translate-x-[50%] flex items-center justify-center h-[50px] w-[50px] bg-green-500 rounded-[4px]"
    >
      {{ health1 }}
    </div>

    <div
      v-if="timeWait > 0"
      class="h-[160px] w-[120px] text-[12px] bg-red-500 fixed z-10 top-[30vh] left-[50vw] -translate-x-[50%] flex flex-col items-center justify-center"
    >
      {{ selfWait ? "打出防御卡进行防御" : "等待对方进行防御" }}
      <div>t:{{ timeWait }}</div>

      <div
        v-if="selfWait"
        class="mt-4 text-blue-800 text-[14px]"
        @click="skipDefenseCard"
      >
        skip
      </div>
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
const health1 = ref(10);
const health2 = ref(10);
const selfWait = ref(false);
const timeWait = ref(0);
onMounted(() => {
  gsap.registerPlugin(PixiPlugin);
  PixiPlugin.registerPIXI(PIXI);

  (async () => {
    await loadAssets();
    // Create a new application
    const app = new Application();
    initDevtools({ app });

    // Initialize the application
    await app.init({ background: "#1099bb", resizeTo: window });

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
    gameManager.healthManager.emitter.on("updateHealth", (data) => {
      if (data.self) {
        health1.value = data.health;
      } else {
        health2.value = data.health;
      }
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
          gameManager.pushCard(0, initData?.self?.handcards || []);
          gameManager.pushCard(1, initData?.enemy?.handcards || []);
        }
        {
          // 初始化血量
          gameManager.healthManager.updateHealth(
            true,
            initData?.self?.health || 10
          );
          gameManager.healthManager.updateHealth(
            false,
            initData?.enemy?.health || 10
          );
        }
        {
          //初始化回合指示区
          selfTurn.value = data.data.selfTurn;
        }
      } else if (data.type === "turnStart") {
        gameManager.turnIdxZone.toggle(data.self);
      } else if (data.type === "turnEndTimeout") {
        gameManager.turnIdxZone.updateTime(Number(data.data));
      } else if (data.type === "removeCard") {
        gameManager.removeCardFromHand(Number(data.data));
      } else if (data.type === "moreHandCard") {
        showToast("手牌爆拉~");
      } else if (data.type === "p2RemoveCard") {
        gameManager.removeCardP2(data.data);
      } else if (data.type === "homeHurt") {
        const lastHealth = Number(data.data.lastHealth);
        const role = Number(data.data.role);
        // 0自己 1对方
        if (role === 0) {
          gameManager.healthManager.updateHealth(true, lastHealth);
        } else {
          gameManager.healthManager.updateHealth(false, lastHealth);
        }
      } else if (data.type === "waitDefenseCard") {
        selfWait.value = data.data.self;
        timeWait.value = data.data.time;
      } else if (data.type === "drawCard") {
        if (data.self) {
          gameManager.pushCard(0, data.data);
        } else {
          gameManager.pushCard(1, data.data);
        }
      } else if (data.type === "gameOver") {
        showToast(data.data == "win" ? "你赢了" : "你输了");
      }
    };
    sse.onerror = (event) => {
      console.log(event);
    };
    sse.addEventListener("error", (event: any) => {
      sse.close();
      showToast("连接失败，刷新试试~");
    });
  })();
});

function skipDefenseCard() {
  fetch("/api/skipDefenseCard");
}

function debug() {
  axios.get("/api/debug");
}

function endTurn() {
  console.log("endTurn");
  axios.get("/api/turnEnd");
}
</script>
<style lang="less" scoped></style>
