<template>
  <div class="bg-[#2a174c] relative pt-[60px]">
    <div class="w-[100vw] p-[6px]">
      <div
        class="z-10 w-full absolute top-0 left-0"
        :style="{
          height: maxHeight + 'px',
        }"
        @click="click"
      >
        <span
          @click.stop="$router.push('/')"
          class="absolute text-[#f1f5f9] top-[18px] left-3 text-[20px]"
          ><
        </span>
        <div class="text-center p-[20px] text-[#f1f5f9]">
          <span> 点击卡片查看详情</span>
        </div>
      </div>
      <div
        ref="allDivRef"
        class="w-full min-h-[100vh]"
        :style="{
          height: maxHeight + 'px',
        }"
      ></div>
    </div>
  </div>

  <div
    @click="close"
    v-if="showDetail"
    class="fixed right-0 top-0 w-[100vw] h-[100vh] bg-[#171616df] z-10 flex justify-center items-center"
  >
    <div class="w-[220px] h-[320px]" ref="divRef"></div>
  </div>
</template>
<script lang="ts" setup>
import CardComp from "./card.vue";

import { Application } from "pixi.js";
import { nextTick, onMounted, ref, useTemplateRef } from "vue";
import { Card } from "../game/Card";
import { loadAssets } from "../utils/loadAssets";
import axios from "axios";
const allDivRef = useTemplateRef("allDivRef");
const divRef = useTemplateRef("divRef");
const showDetail = ref(false);
const allCards = ref<any[]>([]);
const maxHeight = ref(0);
let cardH = 0;
let detailApp: Application;
async function clickCard(params: any) {
  showDetail.value = true;
  await nextTick();
  const app = new Application();
  await loadAssets();
  await app.init({
    background: "#2a174c",
    resizeTo: divRef.value!,
    resolution: window.devicePixelRatio,
    autoDensity: true,
  });
  divRef.value?.appendChild(app.canvas);
  const card = new Card(0, 0, params as any, app);
  card.scale = app.screen.width / Card.width;
  card.draggle = false;
  card.pivot.set(0, 0);
  app.stage.addChild(card);
  detailApp = app;
}
function close() {
  showDetail.value = false;
  detailApp?.destroy();
}
load();
async function load() {
  const { data } = await axios.get("/api/allCards");
  maxHeight.value = (190 * (data.length || 0)) / 3;
  await nextTick();
  allCards.value = data;
  const app = new Application();
  await loadAssets();
  await app.init({
    background: "#2a174c",
    resizeTo: allDivRef.value!,
    resolution: window.devicePixelRatio,
    autoDensity: true,
  });
  allDivRef.value?.appendChild(app.canvas);
  let idx = 0;
  const gap = 10;
  const cardW = (app.screen.width - gap * 2) / 3;
  for (const params of data || []) {
    const card = new Card(0, 0, params as any, app);
    card.draggle = false;
    card.pivot.set(0, 0);
    app.stage.addChild(card);
    card.scale = cardW / Card.width;
    cardH = card.height;
    card.x = (idx % 3) * (cardW + gap);
    const row = Math.floor(idx / 3);
    card.y = row * (card.height + 10);
    idx++;
  }
  console.log(cardH);
}

function click(event: any) {
  const x = event.offsetX;
  const y = event.offsetY;
  const width = allDivRef.value?.clientWidth || 0;
  const col = Math.floor(x / (width / 3));
  const row = Math.floor(y / (cardH + 10));
  const card = allCards.value[row * 3 + col];
  if (card) {
    clickCard(card);
  }
  console.log(`鼠标点击位置：(${x}, ${y}) ${width}`);
  console.log(col, row);
}
</script>
<style lang="less" scoped></style>
